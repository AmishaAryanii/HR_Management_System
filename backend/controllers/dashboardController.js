const { Employee, User, Department, Designation, Attendance, Leave, Payroll, Payslip, Task, Announcement, ActivityLog, PerformanceReview, LeaveBalance, Sequelize } = require('../models');
const { asyncHandler } = require('../middleware/errorHandler');
const { Op, fn, col } = Sequelize;

const getSuperAdminDashboard = asyncHandler(async (req, res) => {
  const totalEmployees = await Employee.count();
  const activeEmployees = await Employee.count({ where: { employmentStatus: 'active' } });
  const totalAdmins = await User.count({ where: { role: { [Op.in]: ['super_admin', 'admin'] }, isActive: true } });
  // Count employees who are managers (have at least one subordinate)
  const employeesWithSubordinates = await Employee.findAll({
    attributes: ['reportingManagerId'],
    where: { reportingManagerId: { [Op.ne]: null } },
    group: ['reportingManagerId']
  });
  const totalManagers = employeesWithSubordinates.length;

  const today = new Date().toISOString().split('T')[0];
  const todayAttendance = await Attendance.count({ where: { date: today, status: { [Op.in]: ['present', 'late'] } } });
  const todayAbsent = await Attendance.count({ where: { date: today, status: 'absent' } });
  const onLeave = await Leave.count({ where: { status: 'approved', startDate: { [Op.lte]: today }, endDate: { [Op.gte]: today } } });

  const pendingLeaves = await Leave.count({ where: { status: 'pending' } });
  const month = new Date().getMonth() + 1;
  const year = new Date().getFullYear();
  const payrollProcessed = await Payroll.count({ where: { month, year, status: 'generated' } });
  const payrollPaid = await Payroll.count({ where: { month, year, status: 'paid' } });

  const recentActivities = await ActivityLog.findAll({
    order: [['createdAt', 'DESC']],
    limit: 10,
    include: [{ model: User, as: 'user', attributes: ['id', 'username', 'email'] }]
  });

  // Department distribution
const deptDistribution = await Employee.findAll({
  attributes: ['departmentId', [fn('COUNT', col('Employee.id')), 'count']],
  where: { employmentStatus: 'active' },
  include: [{ model: Department, as: 'department', attributes: ['name'] }],
  group: ['departmentId', 'department.id', 'department.name']
});

  // Monthly hires
const monthlyHires = await Employee.findAll({
    attributes: [
      [fn('MONTH', col('joining_date')), 'month'],
      [fn('YEAR', col('joining_date')), 'year'],
      [fn('COUNT', col('Employee.id')), 'count']
    ],
    
    group: ['month', 'year'],
    order: [['year', 'DESC'], ['month', 'DESC']],
    limit: 12
  });

  const totalPayrollThisMonth = await Payroll.sum('netPay', { where: { month, year } }) || 0;

  res.json({
    success: true,
    data: {
      overview: { totalEmployees, activeEmployees, totalAdmins, totalManagers },
      attendance: { todayPresent: todayAttendance, todayAbsent, onLeave, totalPresent: todayAttendance + todayAbsent + onLeave },
      leave: { pending: pendingLeaves },
      payroll: { processed: payrollProcessed, paid: payrollPaid, totalNetPay: totalPayrollThisMonth },
      recentActivities,
      charts: { departmentDistribution: deptDistribution, monthlyHires }
    }
  });
});

const getAdminDashboard = asyncHandler(async (req, res) => {
  const totalEmployees = await Employee.count({ where: { employmentStatus: 'active' } });
  const totalDepts = await Department.count({ where: { status: 'active' } });
  const today = new Date().toISOString().split('T')[0];

  const todayPresent = await Attendance.count({ where: { date: today, status: { [Op.in]: ['present', 'late'] } } });
  const todayAbsent = await Attendance.count({ where: { date: today, status: 'absent' } });
  const todayLate = await Attendance.count({ where: { date: today, status: 'late' } });
  const pendingLeaves = await Leave.count({ where: { status: 'pending' } });
  const pendingTasks = await Task.count({ where: { status: { [Op.in]: ['assigned', 'in_progress'] } } });

  // Get today's attendance records with employee details
  const todayAttendanceRecords = await Attendance.findAll({
    where: { date: today },
    include: [{
      model: Employee,
      as: 'employee',
      attributes: ['id', 'firstName', 'lastName', 'employeeId'],
      include: [{ model: Department, as: 'department', attributes: ['name'] }]
    }],
    order: [['checkIn', 'ASC']]
  });

  // Also get active employees who have no attendance record today (missing)
  const attendedEmployeeIds = todayAttendanceRecords.map(r => r.employeeId);
  const missingEmployees = await Employee.findAll({
    where: {
      employmentStatus: 'active',
      id: { [Op.notIn]: attendedEmployeeIds.length > 0 ? attendedEmployeeIds : [0] }
    },
    attributes: ['id', 'firstName', 'lastName', 'employeeId'],
    include: [{ model: Department, as: 'department', attributes: ['name'] }],
    limit: 20
  });

  const recentActivities = await ActivityLog.findAll({ order: [['createdAt', 'DESC']], limit: 10 });

  res.json({
    success: true,
    data: {
      overview: { totalEmployees, totalDepartments: totalDepts },
      attendance: { present: todayPresent, absent: todayAbsent, late: todayLate },
      attendanceRecords: todayAttendanceRecords.map(r => ({
        id: r.id,
        employeeId: r.employee?.id,
        firstName: r.employee?.firstName,
        lastName: r.employee?.lastName,
        employeeCode: r.employee?.employeeId,
        department: r.employee?.department?.name || '-',
        checkIn: r.checkIn,
        checkOut: r.checkOut,
        workingHours: r.workingHours,
        status: r.status
      })),
      missingEmployees: missingEmployees.map(e => ({
        id: e.id,
        firstName: e.firstName,
        lastName: e.lastName,
        employeeCode: e.employeeId,
        department: e.department?.name || '-'
      })),
      leave: { pending: pendingLeaves },
      tasks: { pending: pendingTasks },
      recentActivities
    }
  });
});

const getManagerDashboard = asyncHandler(async (req, res) => {
  const emp = await Employee.findOne({ where: { userId: req.user.id } });
  if (!emp) return res.status(404).json({ success: false, message: 'Employee not found' });

  const team = await Employee.findAll({ where: { reportingManagerId: emp.id, employmentStatus: 'active' }, attributes: ['id', 'firstName', 'lastName', 'dateOfBirth'] });
  const teamIds = team.map(t => t.id);
  // Include manager themselves in team for overview counts
  const allIds = [emp.id, ...teamIds];

  const today = new Date().toISOString().split('T')[0];

  // Attendance counts
  const teamAttendance = await Attendance.count({ where: { employeeId: { [Op.in]: allIds }, date: today, status: { [Op.in]: ['present', 'late'] } } });
  const teamAbsent = await Attendance.count({ where: { employeeId: { [Op.in]: allIds }, date: today, status: 'absent' } });
  const onLeave = await Leave.count({ where: { employeeId: { [Op.in]: allIds }, status: 'approved', startDate: { [Op.lte]: today }, endDate: { [Op.gte]: today } } });

  // Pending items
  const pendingLeaves = await Leave.count({ where: { employeeId: { [Op.in]: teamIds }, status: 'pending' } });
  const pendingTasks = await Task.count({ where: { assignedTo: { [Op.in]: teamIds }, status: { [Op.in]: ['assigned', 'in_progress'] } } });

  // Performance summary
  const perfStats = await PerformanceReview.findAll({
    attributes: ['employeeId', [fn('AVG', col('overall_rating')), 'avgRating']],
    where: { employeeId: { [Op.in]: teamIds }, status: 'completed', overallRating: { [Op.ne]: null } },
    group: ['employeeId']
  });
  const avgTeamRating = perfStats.length > 0
    ? (perfStats.reduce((s, r) => s + parseFloat(r.dataValues.avgRating || 0), 0) / perfStats.length).toFixed(1)
    : 'N/A';

  // Upcoming birthdays (within next 30 days)
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
  const upcomingBirthdays = team.filter(m => {
    if (!m.dateOfBirth) return false;
    const bd = new Date(m.dateOfBirth);
    const bdMonth = bd.getMonth() + 1;
    const bdDay = bd.getDate();
    // Birthday within next 30 days
    const todayDays = currentMonth * 100 + now.getDate();
    const bdDays = bdMonth * 100 + bdDay;
    let diff = bdDays - todayDays;
    if (diff < 0) diff += 1200; // wrap around year
    return diff >= 0 && diff <= 30;
  }).map(m => ({
    id: m.id,
    firstName: m.firstName,
    lastName: m.lastName,
    dateOfBirth: m.dateOfBirth
  }));

  // Detailed team members
  const teamMembers = await Employee.findAll({
    where: { id: { [Op.in]: allIds } },
    attributes: ['id', 'firstName', 'lastName', 'employeeId', 'email', 'phone', 'joiningDate', 'profilePhoto'],
    include: [
      { association: 'designation', attributes: ['title'] },
      { association: 'department', attributes: ['name'] },
      { model: Attendance, as: 'attendances', where: { date: today }, required: false, attributes: ['status', 'checkIn', 'checkOut'] }
    ]
  });

  // Completed reviews count
  const completedReviews = await PerformanceReview.count({ where: { employeeId: { [Op.in]: teamIds }, status: 'completed' } });

  res.json({
    success: true,
    data: {
      overview: {
        teamSize: team.length,
        teamAttendance,
        teamAbsent,
        onLeave,
        pendingLeaves,
        pendingTasks,
        completedReviews,
        avgTeamRating
      },
      upcomingBirthdays,
      teamMembers
    }
  });
});

const getEmployeeDashboard = asyncHandler(async (req, res) => {
  const emp = await Employee.findOne({
    where: { userId: req.user.id },
    include: [{ association: 'department' }, { association: 'designation' }, { association: 'manager' }]
  });
  if (!emp) return res.status(404).json({ success: false, message: 'Employee not found' });

  const today = new Date().toISOString().split('T')[0];
  const todayAttendance = await Attendance.findOne({ where: { employeeId: emp.id, date: today } });

  const year = new Date().getFullYear();
  const leaveBalance = await LeaveBalance.findOne({ where: { employeeId: emp.id, year } });

  const pendingTasks = await Task.count({ where: { assignedTo: emp.id, status: { [Op.in]: ['assigned', 'in_progress'] } } });

  const recentAnnouncements = await Announcement.findAll({
    where: { status: 'published', type: { [Op.in]: ['company', 'department'] } },
    order: [['createdAt', 'DESC']],
    limit: 5
  });

  const todayLeaves = await Leave.count({
    where: {
      employeeId: emp.id,
      status: 'approved',
      startDate: { [Op.lte]: today },
      endDate: { [Op.gte]: today }
    }
  });

  // Fetch latest payslip for the employee
  const latestPayslip = await Payslip.findOne({
    where: { employeeId: emp.id },
    order: [['year', 'DESC'], ['month', 'DESC'], ['createdAt', 'DESC']],
    include: [{ model: Payroll, as: 'payroll', attributes: ['status', 'paymentMethod', 'paidAt'] }]
  });

  res.json({
    success: true,
    data: {
      employee: emp,
      attendance: todayAttendance || { date: today, status: 'absent' },
      leaveBalance: leaveBalance || { casual: 12, sick: 12, earned: 18 },
      tasks: { pending: pendingTasks },
      announcements: recentAnnouncements,
      onLeave: todayLeaves > 0,
      latestPayslip: latestPayslip ? {
        id: latestPayslip.id,
        month: latestPayslip.month,
        year: latestPayslip.year,
        netPay: latestPayslip.netPay,
        grossPay: latestPayslip.grossPay,
        basicSalary: latestPayslip.basicSalary,
        totalDeductions: latestPayslip.totalDeductions,
        payslipNumber: latestPayslip.payslipNumber,
        status: latestPayslip.payroll?.status || 'generated',
        paidAt: latestPayslip.payroll?.paidAt || null
      } : null
    }
  });
});

module.exports = { getSuperAdminDashboard, getAdminDashboard, getManagerDashboard, getEmployeeDashboard };
