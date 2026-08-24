const { Attendance, Employee, ActivityLog, Sequelize } = require('../models');
const { asyncHandler } = require('../middleware/errorHandler');
const { notifyUser } = require('../services/notify');
const { Op } = Sequelize;

const getAttendances = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, startDate, endDate, employeeId, status, departmentId } = req.query;
  const offset = (page - 1) * limit;
  const where = {};

  if (startDate) where.date = { ...where.date, [Op.gte]: startDate };
  if (endDate) where.date = { ...where.date, [Op.lte]: endDate };
  if (employeeId) where.employeeId = employeeId;
  if (status) where.status = status;

  // Role-based scoping: employees and managers should only see records
  // relevant to them, regardless of what query params are passed.
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

  const include = [{ model: Employee, as: 'employee', attributes: ['id', 'firstName', 'lastName', 'employeeId', 'departmentId'] }];
  if (departmentId) {
    include[0].where = { departmentId };
  }

  const { count, rows } = await Attendance.findAndCountAll({
    where,
    include,
    order: [['date', 'DESC'], ['createdAt', 'DESC']],
    limit: parseInt(limit),
    offset: parseInt(offset)
  });

  res.json({ success: true, data: rows, pagination: { total: count, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(count / limit) } });
});

const getAttendance = asyncHandler(async (req, res) => {
  const attendance = await Attendance.findByPk(req.params.id, {
    include: [{ model: Employee, as: 'employee' }]
  });
  if (!attendance) return res.status(404).json({ success: false, message: 'Attendance record not found' });

  // Prevent an employee from viewing someone else's single record by guessing the ID.
  if (req.user.role === 'employee') {
    const emp = await Employee.findOne({ where: { userId: req.user.id } });
    if (!emp || attendance.employeeId !== emp.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this record' });
    }
  }

  res.json({ success: true, data: attendance });
});

const checkIn = asyncHandler(async (req, res) => {
  const employee = await Employee.findOne({ where: { userId: req.user.id } });
  if (!employee) return res.status(404).json({ success: false, message: 'Employee profile not found' });

  const today = new Date().toISOString().split('T')[0];
  
  const existing = await Attendance.findOne({ where: { employeeId: employee.id, date: today } });
  if (existing && existing.checkIn) {
    return res.status(400).json({ success: false, message: 'Already checked in today' });
  }

  const now = new Date();
  const checkInTime = now.getHours() * 60 + now.getMinutes();
  const lateThreshold = 9 * 60 + 15; // 9:15 AM
  const isLate = checkInTime > lateThreshold;
  const lateMinutes = isLate ? checkInTime - lateThreshold : 0;

  if (existing) {
    await existing.update({ checkIn: now, isLate, lateMinutes, status: isLate ? 'late' : 'present' });
    res.json({ success: true, message: 'Check-in updated', data: existing });
  } else {
    const attendance = await Attendance.create({
      employeeId: employee.id,
      date: today,
      checkIn: now,
      isLate,
      lateMinutes,
      status: isLate ? 'late' : 'present',
      ipAddress: req.ip
    });
    res.json({ success: true, message: 'Check-in successful', data: attendance });
  }
});

const checkOut = asyncHandler(async (req, res) => {
  const employee = await Employee.findOne({ where: { userId: req.user.id } });
  if (!employee) return res.status(404).json({ success: false, message: 'Employee profile not found' });

  const today = new Date().toISOString().split('T')[0];
  const attendance = await Attendance.findOne({ where: { employeeId: employee.id, date: today } });
  if (!attendance || !attendance.checkIn) {
    return res.status(400).json({ success: false, message: 'No check-in record found for today' });
  }
  if (attendance.checkOut) {
    return res.status(400).json({ success: false, message: 'Already checked out today' });
  }

  const now = new Date();
  const checkInTime = new Date(attendance.checkIn).getTime();
  const totalMs = now.getTime() - checkInTime;
  const breakMs = (attendance.breakOut && attendance.breakIn) 
    ? new Date(attendance.breakOut).getTime() - new Date(attendance.breakIn).getTime() 
    : 0;
  const workingMs = totalMs - breakMs;
  const totalHours = Math.round((totalMs / 3600000) * 100) / 100;
  const workingHours = Math.round((workingMs / 3600000) * 100) / 100;
  const overtimeMinutes = workingHours > 8 ? Math.round((workingHours - 8) * 60) : 0;

  await attendance.update({
    checkOut: now,
    totalHours,
    breakHours: Math.round((breakMs / 3600000) * 100) / 100,
    workingHours,
    overtimeMinutes
  });

  res.json({ success: true, message: 'Check-out successful', data: attendance });
});

const breakIn = asyncHandler(async (req, res) => {
  const employee = await Employee.findOne({ where: { userId: req.user.id } });
  if (!employee) return res.status(404).json({ success: false, message: 'Employee profile not found' });

  const today = new Date().toISOString().split('T')[0];
  const attendance = await Attendance.findOne({ where: { employeeId: employee.id, date: today } });
  if (!attendance || !attendance.checkIn) {
    return res.status(400).json({ success: false, message: 'No check-in record found' });
  }
  if (attendance.breakIn && !attendance.breakOut) {
    return res.status(400).json({ success: false, message: 'Already on break' });
  }

  await attendance.update({ breakIn: new Date() });
  res.json({ success: true, message: 'Break started', data: attendance });
});

const breakOut = asyncHandler(async (req, res) => {
  const employee = await Employee.findOne({ where: { userId: req.user.id } });
  if (!employee) return res.status(404).json({ success: false, message: 'Employee profile not found' });

  const today = new Date().toISOString().split('T')[0];
  const attendance = await Attendance.findOne({ where: { employeeId: employee.id, date: today } });
  if (!attendance || !attendance.breakIn) {
    return res.status(400).json({ success: false, message: 'No break started' });
  }
  if (attendance.breakOut) {
    return res.status(400).json({ success: false, message: 'Break already ended' });
  }

  await attendance.update({ breakOut: new Date() });
  res.json({ success: true, message: 'Break ended', data: attendance });
});

const getMonthlyReport = asyncHandler(async (req, res) => {
  const { month, year, employeeId, departmentId } = req.query;
  const m = month || new Date().getMonth() + 1;
  const y = year || new Date().getFullYear();

  const startDate = `${y}-${String(m).padStart(2, '0')}-01`;
  const endDate = new Date(y, m, 0).toISOString().split('T')[0];

  const where = { date: { [Op.between]: [startDate, endDate] } };
  if (employeeId) where.employeeId = employeeId;

  // Role-based scoping, same logic as getAttendances above.
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
        return res.json({ success: true, data: { records: [], summary: { present: 0, absent: 0, late: 0, onLeave: 0, halfDay: 0, totalOvertime: 0, totalWorkingHours: 0 }, month: parseInt(m), year: parseInt(y) } });
      }
    }
  }

  const include = [{ model: Employee, as: 'employee', attributes: ['id', 'firstName', 'lastName', 'employeeId', 'departmentId'] }];
  if (departmentId) include[0].where = { departmentId };

  const records = await Attendance.findAll({ where, include, order: [['date', 'ASC']] });

  const summary = {
    present: records.filter(r => r.status === 'present' || r.status === 'late').length,
    absent: records.filter(r => r.status === 'absent').length,
    late: records.filter(r => r.isLate).length,
    onLeave: records.filter(r => r.status === 'on_leave').length,
    halfDay: records.filter(r => r.status === 'half_day').length,
    totalOvertime: records.reduce((sum, r) => sum + (r.overtimeMinutes || 0), 0),
    totalWorkingHours: records.reduce((sum, r) => sum + parseFloat(r.workingHours || 0), 0),
  };

  res.json({ success: true, data: { records, summary, month: parseInt(m), year: parseInt(y) } });
});

const markAttendance = asyncHandler(async (req, res) => {
  const { employeeId, date, status, checkIn, checkOut, notes } = req.body;

  const [attendance, created] = await Attendance.findOrCreate({
    where: { employeeId, date },
    defaults: { employeeId, date, status, checkIn, checkOut, notes, markedBy: req.user.id }
  });

  if (!created) {
    await attendance.update({ status, checkIn, checkOut, notes, markedBy: req.user.id });
  }

  await ActivityLog.create({
    userId: req.user.id,
    employeeId,
    action: created ? 'ATTENDANCE_MARKED' : 'ATTENDANCE_UPDATED',
    resource: 'attendance',
    description: `Attendance ${created ? 'marked' : 'updated'} for ${date}`,
    severity: 'info'
  });

  // Notify the employee about attendance correction/update
  if (!created) {
    const targetEmployee = await Employee.findByPk(employeeId, { include: [{ association: 'user' }] });
    if (targetEmployee?.user) {
      await notifyUser({
        userId: targetEmployee.user.id,
        employeeId: targetEmployee.id,
        type: 'attendance_correction',
        title: 'Attendance Updated',
        message: `Your attendance for ${date} has been updated to: ${status}`,
        actionUrl: '/attendance'
      });
    }
  }

  res.json({ success: true, message: `Attendance ${created ? 'marked' : 'updated'} successfully`, data: attendance });
});

module.exports = { getAttendances, getAttendance, checkIn, checkOut, breakIn, breakOut, getMonthlyReport, markAttendance };