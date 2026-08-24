const { Timesheet, Employee, ActivityLog, Notification, Sequelize } = require('../models');
const { asyncHandler } = require('../middleware/errorHandler');
const { Op } = Sequelize;

const getTimesheets = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, startDate, endDate, employeeId, status } = req.query;
  const offset = (page - 1) * limit;
  const where = {};

  if (startDate) where.date = { ...where.date, [Op.gte]: startDate };
  if (endDate) where.date = { ...where.date, [Op.lte]: endDate };
  if (employeeId) where.employeeId = employeeId;
  if (status) where.status = status;

  // Role-based scoping
  if (req.user.role === 'employee') {
    const emp = await Employee.findOne({ where: { userId: req.user.id } });
    if (emp) where.employeeId = emp.id;
  } else if (req.user.role === 'manager') {
    const emp = await Employee.findOne({ where: { userId: req.user.id } });
    if (emp) {
      const subordinates = await Employee.findAll({ where: { reportingManagerId: emp.id }, attributes: ['id'] });
      const ids = subordinates.map(s => s.id);
      // Team view: only show subordinates' entries
      if (ids.length > 0) {
        where.employeeId = { [Op.in]: ids };
      } else {
        return res.json({ success: true, data: [], meta: { weeklyHours: 0, pendingCount: 0, total: 0, page: parseInt(page), limit: parseInt(limit), totalPages: 0 } });
      }
    }
  }

  const { count, rows } = await Timesheet.findAndCountAll({
    where,
    include: [{ model: Employee, as: 'employee', attributes: ['id', 'firstName', 'lastName', 'employeeId'] }],
    order: [['date', 'DESC']],
    limit: parseInt(limit),
    offset: parseInt(offset)
  });

  // Weekly summary
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const emp = await Employee.findOne({ where: { userId: req.user.id } });
  let summaryWhere = {};
  if (emp) {
    if (req.user.role === 'employee') {
      summaryWhere.employeeId = emp.id;
    } else if (req.user.role === 'manager') {
      const subordinates = await Employee.findAll({ where: { reportingManagerId: emp.id }, attributes: ['id'] });
      const ids = subordinates.map(s => s.id);
      // Team weekly summary: only subordinates' hours
      if (ids.length > 0) {
        summaryWhere.employeeId = { [Op.in]: ids };
      } else {
        // No subordinates — return empty meta but still query normally (will be 0)
        summaryWhere.employeeId = { [Op.in]: [] };
      }
    }
  }
  summaryWhere.date = { [Op.between]: [weekStart.toISOString().split('T')[0], weekEnd.toISOString().split('T')[0]] };

  const weeklyRows = await Timesheet.findAll({ where: summaryWhere, attributes: ['employeeId', 'hours'] });
  const weeklyHours = weeklyRows.reduce((sum, r) => sum + parseFloat(r.hours || 0), 0);
  const pendingCount = await Timesheet.count({ where: { ...where, status: 'pending' } });

  res.json({
    success: true,
    data: rows,
    meta: { weeklyHours: Math.round(weeklyHours * 100) / 100, pendingCount, total: count, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(count / limit) }
  });
});

const createTimesheet = asyncHandler(async (req, res) => {
  const emp = await Employee.findOne({ where: { userId: req.user.id } });
  if (!emp) return res.status(404).json({ success: false, message: 'Employee not found' });

  const { date, project, task, hours } = req.body;
  if (!date || !task || !hours) {
    return res.status(400).json({ success: false, message: 'Date, task, and hours are required' });
  }

  const timesheet = await Timesheet.create({
    employeeId: emp.id,
    date, project, task, hours
  });

  // Notify manager
  if (emp.reportingManagerId) {
    const manager = await Employee.findByPk(emp.reportingManagerId, { include: [{ association: 'user' }] });
    if (manager?.user) {
      await Notification.create({
        userId: manager.user.id,
        employeeId: manager.id,
        type: 'timesheet',
        title: 'New Timesheet Entry',
        message: `${emp.firstName} ${emp.lastName} submitted ${hours}h for ${date}`,
        actionUrl: '/timesheets'
      });
    }
  }

  res.status(201).json({ success: true, message: 'Timesheet entry created', data: timesheet });
});

const updateTimesheetStatus = asyncHandler(async (req, res) => {
  const { status, comment } = req.body;
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Status must be approved or rejected' });
  }

  const timesheet = await Timesheet.findByPk(req.params.id, { include: [{ association: 'employee' }] });
  if (!timesheet) return res.status(404).json({ success: false, message: 'Timesheet entry not found' });

  const emp = await Employee.findOne({ where: { userId: req.user.id } });
  if (!emp) return res.status(404).json({ success: false, message: 'Employee not found' });

  // Verify manager has authority over this employee
  if (req.user.role === 'manager') {
    if (timesheet.employee.reportingManagerId !== emp.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to review this entry' });
    }
  }

  await timesheet.update({
    status,
    reviewedBy: emp.id,
    reviewComment: comment || null,
    reviewedAt: new Date()
  });

  // Notify employee
  if (timesheet.employee?.userId) {
    await Notification.create({
      userId: timesheet.employee.userId,
      employeeId: timesheet.employeeId,
      type: 'timesheet',
      title: `Timesheet ${status}`,
      message: `Your timesheet entry for ${timesheet.date} has been ${status}${comment ? ': ' + comment : ''}`,
      actionUrl: '/timesheets'
    });
  }

  res.json({ success: true, message: `Timesheet ${status}`, data: timesheet });
});

const deleteTimesheet = asyncHandler(async (req, res) => {
  const timesheet = await Timesheet.findByPk(req.params.id);
  if (!timesheet) return res.status(404).json({ success: false, message: 'Timesheet entry not found' });

  const emp = await Employee.findOne({ where: { userId: req.user.id } });
  if (!emp || (timesheet.employeeId !== emp.id && req.user.role === 'employee')) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  await timesheet.destroy();
  res.json({ success: true, message: 'Timesheet entry deleted' });
});

module.exports = { getTimesheets, createTimesheet, updateTimesheetStatus, deleteTimesheet };
