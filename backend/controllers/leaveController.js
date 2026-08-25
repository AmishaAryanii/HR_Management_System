const { Leave, LeaveBalance, Employee, ActivityLog, Sequelize } = require('../models');
const { asyncHandler } = require('../middleware/errorHandler');
const { notifyUser, notifyMany } = require('../services/notify');
const { Op } = Sequelize;

const getLeaves = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, leaveType, employeeId, startDate, endDate } = req.query;
  const offset = (page - 1) * limit;
  const where = {};

  if (status) where.status = status;
  if (leaveType) where.leaveType = leaveType;
  if (employeeId) where.employeeId = employeeId;
  if (startDate) where.startDate = { [Op.gte]: startDate };
  if (endDate) where.endDate = { [Op.lte]: endDate };

  // Role-based filtering
  if (req.user.role === 'employee') {
    const emp = await Employee.findOne({ where: { userId: req.user.id } });
    if (emp) where.employeeId = emp.id;
  } else if (req.user.role === 'manager') {
    const emp = await Employee.findOne({ where: { userId: req.user.id } });
    if (emp) {
      const subordinates = await Employee.findAll({ where: { reportingManagerId: emp.id }, attributes: ['id'] });
      const subIds = subordinates.map(s => s.id);
      // Team view: only subordinates by default
      // If a specific employeeId is requested and is a subordinate OR the manager themself, use it directly
      if (employeeId && (subIds.includes(parseInt(employeeId)) || parseInt(employeeId) === emp.id)) {
        where.employeeId = parseInt(employeeId);
      } else if (subIds.length > 0) {
        where.employeeId = { [Op.in]: subIds };
      } else {
        return res.json({ success: true, data: [], pagination: { total: 0, page: parseInt(page), limit: parseInt(limit), totalPages: 0 } });
      }
    }
  }

  const { count, rows } = await Leave.findAndCountAll({
    where,
    include: [
      { model: Employee, as: 'employee', attributes: ['id', 'firstName', 'lastName', 'employeeId'],
        include: [{ association: 'department', attributes: ['name'] }, { association: 'designation', attributes: ['title'] }] },
      { model: Employee, as: 'manager', attributes: ['id', 'firstName', 'lastName'] },
      { model: Employee, as: 'admin', attributes: ['id', 'firstName', 'lastName'] }
    ],
    order: [['createdAt', 'DESC']],
    limit: parseInt(limit),
    offset: parseInt(offset)
  });

  res.json({ success: true, data: rows, pagination: { total: count, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(count / limit) } });
});

const getLeave = asyncHandler(async (req, res) => {
  const leave = await Leave.findByPk(req.params.id, { include: [{ association: 'employee' }, { association: 'manager' }, { association: 'admin' }] });
  if (!leave) return res.status(404).json({ success: false, message: 'Leave record not found' });

  // Role-based scoping
  if (req.user.role === 'employee') {
    const emp = await Employee.findOne({ where: { userId: req.user.id } });
    if (!emp || leave.employeeId !== emp.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this record' });
    }
  } else if (req.user.role === 'manager') {
    const emp = await Employee.findOne({ where: { userId: req.user.id } });
    if (!emp) return res.status(404).json({ success: false, message: 'Employee not found' });
    const subordinates = await Employee.findAll({ where: { reportingManagerId: emp.id }, attributes: ['id'] });
    const subIds = subordinates.map(s => s.id);
    // Allow if it's their own leave or one of their subordinates'
    if (leave.employeeId !== emp.id && !subIds.includes(leave.employeeId)) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this record' });
    }
  }

  res.json({ success: true, data: leave });
});

const applyLeave = asyncHandler(async (req, res) => {
  // Admin and Super Admin cannot apply leave for themselves
  if (['admin', 'super_admin'].includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Admins and Super Admins cannot apply for leave.' });
  }

  const employee = await Employee.findOne({ where: { userId: req.user.id } });
  if (!employee) return res.status(404).json({ success: false, message: 'Employee profile not found' });

  const { leaveType, startDate, endDate, reason, document } = req.body;

  const start = new Date(startDate);
  const end = new Date(endDate);
  if (end < start) return res.status(400).json({ success: false, message: 'End date cannot be before start date' });
  
  const diffTime = Math.abs(end - start);
  const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  // Check leave balance
  const year = start.getFullYear();
  let balance = await LeaveBalance.findOne({ where: { employeeId: employee.id, year } });
  if (!balance) {
    balance = await LeaveBalance.create({ employeeId: employee.id, year });
  }

  const balanceKey = leaveType;
  const currentBalance = parseFloat(balance[balanceKey] || 0);
  // Unpaid leave doesn't require balance — skip check
  if (leaveType !== 'unpaid' && totalDays > currentBalance) {
    return res.status(400).json({ success: false, message: `Insufficient ${leaveType} leave balance. Available: ${currentBalance} days` });
  }

  const leave = await Leave.create({
    employeeId: employee.id,
    leaveType, startDate, endDate, totalDays, reason, document,
    status: 'pending'
  });

  // Update balance
  await balance.update({ [balanceKey]: currentBalance - totalDays });

  // Notify the applicant (confirmation)
  await notifyUser({
    userId: employee.userId,
    employeeId: employee.id,
    type: 'leave_request',
    title: 'Leave Request Submitted',
    message: `Your ${leaveType} leave request for ${totalDays} day(s) (${startDate} to ${endDate}) has been submitted for approval.`,
    actionUrl: `/leaves/${leave.id}`
  });

  // Notify manager
  if (employee.reportingManagerId) {
    const managerUser = await Employee.findByPk(employee.reportingManagerId, { include: [{ association: 'user' }] });
    if (managerUser?.user) {
      await notifyUser({
        userId: managerUser.user.id,
        employeeId: managerUser.id,
        type: 'leave_request',
        title: 'Leave Request',
        message: `${employee.firstName} ${employee.lastName} applied for ${leaveType} leave (${totalDays} days)`,
        actionUrl: `/leaves/${leave.id}`
      });
    }
  }

  res.status(201).json({ success: true, message: 'Leave applied successfully', data: leave });
});

const approveByManager = asyncHandler(async (req, res) => {
  const leave = await Leave.findByPk(req.params.id, { include: [{ association: 'employee' }] });
  if (!leave) return res.status(404).json({ success: false, message: 'Leave not found' });
  if (leave.status !== 'pending') return res.status(400).json({ success: false, message: `Leave is already ${leave.status}` });

  const { comment } = req.body;
  const employee = await Employee.findOne({ where: { userId: req.user.id } });
  if (!employee) return res.status(404).json({ success: false, message: 'Employee profile not found' });

  // Managers can only approve leaves of their subordinates; admins/super_admins can approve any
  if (req.user.role === 'manager') {
    if (leave.employee.reportingManagerId !== employee.id) {
      return res.status(403).json({ success: false, message: 'You can only approve leaves for employees in your team' });
    }
  }

  // Manager approves internally — status stays 'pending' until admin finalizes
  await leave.update({
    managerComment: comment,
    approvedByManager: employee.id,
    approvedByManagerName: `${employee.firstName} ${employee.lastName}`,
    approvedByManagerRole: 'manager'
  });

  // Notify employee that manager approved, awaiting admin
  const empUser = await Employee.findByPk(leave.employeeId, { include: [{ association: 'user' }] });
  if (empUser?.user) {
    await notifyUser({
      userId: empUser.user.id,
      employeeId: empUser.id,
      type: 'leave_request',
      title: 'Leave - Manager Approved',
      message: `Your ${leave.leaveType} leave request has been approved by your manager (${employee.firstName} ${employee.lastName}). Awaiting admin approval.`,
      actionUrl: `/leaves/${leave.id}`
    });
  }

  // Notify admin
  const admins = await Employee.findAll({
    include: [{ model: require('../models').User, as: 'user', where: { role: ['admin', 'super_admin'], isActive: true } }]
  });
  const adminRecipients = [];
  for (const admin of admins) {
    if (admin?.user) {
      adminRecipients.push({ userId: admin.user.id, employeeId: admin.id });
    }
  }
  if (adminRecipients.length > 0) {
    await notifyMany({
      recipients: adminRecipients,
      type: 'leave_request',
      title: 'Leave Request - Manager Approved',
      message: `Leave request from ${leave.employee.firstName} ${leave.employee.lastName} requires your approval`,
      actionUrl: `/leaves/${leave.id}`
    });
  }

  res.json({ success: true, message: 'Leave approved by manager — pending admin approval', data: leave });
});

const approveByAdmin = asyncHandler(async (req, res) => {
  const leave = await Leave.findByPk(req.params.id, { include: [{ association: 'employee' }] });
  if (!leave) return res.status(404).json({ success: false, message: 'Leave not found' });
  if (leave.status !== 'approved_by_manager' && leave.status !== 'pending') {
    return res.status(400).json({ success: false, message: `Leave cannot be approved. Current status: ${leave.status}` });
  }

  const { comment } = req.body;

  const adminEmp = await Employee.findOne({ where: { userId: req.user.id } });
  const adminName = adminEmp ? `${adminEmp.firstName} ${adminEmp.lastName}` : req.user.username;

  await leave.update({
    status: 'approved',
    adminComment: comment,
    approvedByAdmin: req.user.id,
    approvedByAdminName: adminName,
    approvedByAdminRole: req.user.role,
    approvedAt: new Date()
  });

  // Notify employee
  const empUser = await Employee.findByPk(leave.employeeId, { include: [{ association: 'user' }] });
  if (empUser?.user) {
    await notifyUser({
      userId: empUser.user.id,
      employeeId: empUser.id,
      type: 'leave_approved',
      title: 'Leave Approved',
      message: `Your ${leave.leaveType} leave (${leave.totalDays} days) has been approved by ${adminName}`,
      actionUrl: `/leaves/${leave.id}`,
      responsibleUser: adminName,
      responsibleRole: req.user.role
    });
  }

  res.json({ success: true, message: 'Leave approved successfully', data: leave });
});

const rejectLeave = asyncHandler(async (req, res) => {
  const leave = await Leave.findByPk(req.params.id, { include: [{ association: 'employee' }] });
  if (!leave) return res.status(404).json({ success: false, message: 'Leave not found' });

  const { comment } = req.body;
  const rejectorEmp = await Employee.findOne({ where: { userId: req.user.id } });
  const rejectorName = rejectorEmp ? `${rejectorEmp.firstName} ${rejectorEmp.lastName}` : req.user.username;

  await leave.update({
    status: 'rejected',
    managerComment: req.user.role === 'manager' ? comment : undefined,
    adminComment: ['admin', 'super_admin'].includes(req.user.role) ? comment : undefined,
    rejectedBy: req.user.id,
    rejectedByName: rejectorName,
    rejectedByRole: req.user.role,
    rejectedAt: new Date()
  });

  // Restore balance
  const year = new Date(leave.startDate).getFullYear();
  const balance = await LeaveBalance.findOne({ where: { employeeId: leave.employeeId, year } });
  if (balance) {
    const balanceKey = leave.leaveType;
    await balance.update({ [balanceKey]: parseFloat(balance[balanceKey]) + parseFloat(leave.totalDays) });
  }

  // Notify employee
  const empUser = await Employee.findByPk(leave.employeeId, { include: [{ association: 'user' }] });
  if (empUser?.user) {
    await notifyUser({
      userId: empUser.user.id,
      employeeId: empUser.id,
      type: 'leave_rejected',
      title: 'Leave Rejected',
      message: `Your ${leave.leaveType} leave request has been rejected by ${rejectorName}`,
      actionUrl: `/leaves/${leave.id}`,
      responsibleUser: rejectorName,
      responsibleRole: req.user.role
    });
  }

  res.json({ success: true, message: 'Leave rejected', data: leave });
});

const cancelLeave = asyncHandler(async (req, res) => {
  const employee = await Employee.findOne({ where: { userId: req.user.id } });
  const where = { id: req.params.id };
  if (req.user.role === 'employee' && employee) where.employeeId = employee.id;

  const leave = await Leave.findOne({ where });
  if (!leave) return res.status(404).json({ success: false, message: 'Leave not found' });
  if (leave.status === 'approved' || leave.status === 'rejected') {
    return res.status(400).json({ success: false, message: `Cannot cancel ${leave.status} leave` });
  }

  const year = new Date(leave.startDate).getFullYear();
  const balance = await LeaveBalance.findOne({ where: { employeeId: leave.employeeId, year } });
  if (balance) {
    const balanceKey = leave.leaveType;
    await balance.update({ [balanceKey]: parseFloat(balance[balanceKey]) + parseFloat(leave.totalDays) });
  }

  await leave.update({ status: 'cancelled' });
  res.json({ success: true, message: 'Leave cancelled', data: leave });
});

const getLeaveBalances = asyncHandler(async (req, res) => {
  const employee = await Employee.findOne({ where: { userId: req.user.id } });
  if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });

  const year = new Date().getFullYear();
  let balance = await LeaveBalance.findOne({ where: { employeeId: req.query.employeeId || employee.id, year: req.query.year || year } });
  if (!balance) {
    balance = await LeaveBalance.create({ employeeId: req.query.employeeId || employee.id, year: req.query.year || year });
  }

  res.json({ success: true, data: balance });
});

module.exports = { getLeaves, getLeave, applyLeave, approveByManager, approveByAdmin, rejectLeave, cancelLeave, getLeaveBalances };
