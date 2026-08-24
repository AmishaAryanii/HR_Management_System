const {
  Employee, User, Department, Designation, Attendance, Leave,
  Payroll, Recruitment, Candidate, PerformanceReview, ActivityLog,
  Sequelize
} = require('../models');
const { asyncHandler } = require('../middleware/errorHandler');
const { Op, fn, col } = Sequelize;

/**
 * Helper: get the employee IDs of a manager's subordinates (excluding the manager)
 */
const getSubordinateIds = async (userId) => {
  const emp = await Employee.findOne({ where: { userId } });
  if (!emp) return null;
  const subordinates = await Employee.findAll({
    where: { reportingManagerId: emp.id, employmentStatus: 'active' },
    attributes: ['id']
  });
  const ids = subordinates.map(s => s.id);
  return ids.length > 0 ? ids : null;
};

const getOverview = asyncHandler(async (req, res) => {
  let empWhere = {};
  let attWhere = {};
  let leaveWhere = {};

  // Manager scoping
  if (req.user.role === 'manager') {
    const subIds = await getSubordinateIds(req.user.id);
    if (subIds) {
      empWhere.id = { [Op.in]: subIds };
      attWhere.employeeId = { [Op.in]: subIds };
      leaveWhere.employeeId = { [Op.in]: subIds };
    } else {
      // No subordinates — return zeros
      return res.json({
        success: true,
        data: {
          employees: { total: 0, active: 0, terminated: 0 },
          departments: { total: 0 },
          designations: { total: 0 },
          attendance: { present: 0, absent: 0, onLeave: 0 },
          leave: { pending: 0 }
        }
      });
    }
  }

  const totalEmployees = await Employee.count({ where: empWhere });
  const activeEmployees = await Employee.count({ where: { ...empWhere, employmentStatus: 'active' } });
  const terminatedEmployees = await Employee.count({ where: { ...empWhere, employmentStatus: 'terminated' } });
  const totalDepartments = await Department.count({ where: { status: 'active' } });
  const totalDesignations = await Designation.count();

  const today = new Date().toISOString().split('T')[0];
  const todayPresent = await Attendance.count({ where: { ...attWhere, date: today, status: { [Op.in]: ['present', 'late'] } } });
  const todayAbsent = await Attendance.count({ where: { ...attWhere, date: today, status: 'absent' } });
  const onLeave = await Leave.count({ where: { ...leaveWhere, status: 'approved', startDate: { [Op.lte]: today }, endDate: { [Op.gte]: today } } });
  const pendingLeaves = await Leave.count({ where: { ...leaveWhere, status: 'pending' } });

  res.json({
    success: true,
    data: {
      employees: { total: totalEmployees, active: activeEmployees, terminated: terminatedEmployees },
      departments: { total: totalDepartments },
      designations: { total: totalDesignations },
      attendance: { present: todayPresent, absent: todayAbsent, onLeave },
      leave: { pending: pendingLeaves }
    }
  });
});

const getEmployeeReports = asyncHandler(async (req, res) => {
  let empWhere = { employmentStatus: 'active' };
  let subIds = null;

  if (req.user.role === 'manager') {
    subIds = await getSubordinateIds(req.user.id);
    if (subIds) {
      empWhere.id = { [Op.in]: subIds };
    } else {
      return res.json({
        success: true,
        data: { byDepartment: [], byDesignation: [], byStatus: [], byGender: [], byRole: [], monthlyHires: [] }
      });
    }
  }

  const byDepartment = await Employee.findAll({
    attributes: ['departmentId', [fn('COUNT', col('Employee.id')), 'count']],
    where: empWhere,
    include: [{ model: Department, as: 'department', attributes: ['name'] }],
    group: ['departmentId', 'department.id', 'department.name'],
    order: [[fn('COUNT', col('Employee.id')), 'DESC']]
  });

  const byDesignation = await Employee.findAll({
    attributes: ['designationId', [fn('COUNT', col('Employee.id')), 'count']],
    where: empWhere,
    include: [{ model: Designation, as: 'designation', attributes: ['title'] }],
    group: ['designationId', 'designation.id', 'designation.title'],
    order: [[fn('COUNT', col('Employee.id')), 'DESC']]
  });

  const byStatus = await Employee.findAll({
    attributes: ['employmentStatus', [fn('COUNT', col('id')), 'count']],
    where: empWhere,
    group: ['employmentStatus']
  });

  const byGender = await Employee.findAll({
    attributes: ['gender', [fn('COUNT', col('id')), 'count']],
    where: empWhere,
    group: ['gender']
  });

  // Role breakdown: for managers, compute from their subordinates; for admins, query all active users
  let byRole = [];
  if (req.user.role === 'manager' && subIds) {
    const empUsers = await Employee.findAll({
      where: { id: { [Op.in]: subIds } },
      include: [{ model: User, as: 'user', attributes: ['role'] }]
    });
    const roleCount = {};
    empUsers.forEach(e => {
      if (e.user) {
        const r = e.user.role || 'employee';
        roleCount[r] = (roleCount[r] || 0) + 1;
      }
    });
    byRole = Object.entries(roleCount).map(([role, count]) => ({ role, count }));
  } else {
    byRole = await User.findAll({
      attributes: ['role', [fn('COUNT', col('id')), 'count']],
      where: { isActive: true },
      group: ['role']
    });
  }

  const monthlyHires = await Employee.findAll({
    attributes: [
      [fn('MONTH', col('joining_date')), 'month'],
      [fn('YEAR', col('joining_date')), 'year'],
      [fn('COUNT', col('Employee.id')), 'count']
    ],
    where: empWhere,
    group: ['month', 'year'],
    order: [[fn('YEAR', col('joining_date')), 'DESC'], [fn('MONTH', col('joining_date')), 'DESC']],
    limit: 12
  });

  res.json({
    success: true,
    data: { byDepartment, byDesignation, byStatus, byGender, byRole, monthlyHires }
  });
});

const getAttendanceReport = asyncHandler(async (req, res) => {
  const { month, year, departmentId } = req.query;
  const m = month || new Date().getMonth() + 1;
  const y = year || new Date().getFullYear();

  const startDate = `${y}-${String(m).padStart(2, '0')}-01`;
  const endDate = new Date(y, m, 0).toISOString().split('T')[0];

  const where = { date: { [Op.between]: [startDate, endDate] } };

  // Manager scoping
  if (req.user.role === 'manager') {
    const subIds = await getSubordinateIds(req.user.id);
    if (subIds) {
      where.employeeId = { [Op.in]: subIds };
    } else {
      return res.json({
        success: true,
        data: {
          summary: { total: 0, present: 0, late: 0, absent: 0, onLeave: 0, halfDay: 0, totalWorkingHours: '0.00', totalOvertime: 0 },
          dailyTrend: [],
          month: parseInt(m), year: parseInt(y)
        }
      });
    }
  }

  const include = [{ model: Employee, as: 'employee', attributes: ['id', 'firstName', 'lastName', 'employeeId', 'departmentId'] }];
  if (departmentId) include[0].where = { departmentId };

  const records = await Attendance.findAll({ where, include, order: [['date', 'ASC']] });

  const summary = {
    total: records.length,
    present: records.filter(r => r.status === 'present').length,
    late: records.filter(r => r.status === 'late').length,
    absent: records.filter(r => r.status === 'absent').length,
    onLeave: records.filter(r => r.status === 'on_leave').length,
    halfDay: records.filter(r => r.status === 'half_day').length,
    totalWorkingHours: records.reduce((sum, r) => sum + parseFloat(r.workingHours || 0), 0).toFixed(2),
    totalOvertime: records.reduce((sum, r) => sum + (r.overtimeMinutes || 0), 0)
  };

  const dailyTrend = [];
  const daysInMonth = new Date(y, m, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayRecords = records.filter(r => r.date === dateStr);
    dailyTrend.push({
      date: dateStr,
      present: dayRecords.filter(r => r.status === 'present' || r.status === 'late').length,
      absent: dayRecords.filter(r => r.status === 'absent').length
    });
  }

  res.json({
    success: true,
    data: { summary, dailyTrend, month: parseInt(m), year: parseInt(y) }
  });
});

const getLeaveReport = asyncHandler(async (req, res) => {
  const { year } = req.query;
  const y = year || new Date().getFullYear();

  let leaveWhere = {};
  if (req.user.role === 'manager') {
    const subIds = await getSubordinateIds(req.user.id);
    if (subIds) {
      leaveWhere.employeeId = { [Op.in]: subIds };
    } else {
      return res.json({
        success: true,
        data: {
          byStatus: [], byType: [], monthlyTrend: [],
          totals: { approved: 0, pending: 0, rejected: 0 }
        }
      });
    }
  }

  const byStatus = await Leave.findAll({
    attributes: ['status', [fn('COUNT', col('id')), 'count']],
    where: {
      ...leaveWhere,
      createdAt: { [Op.gte]: new Date(`${y}-01-01`), [Op.lte]: new Date(`${y}-12-31`) }
    },
    group: ['status']
  });

  const byType = await Leave.findAll({
    attributes: ['leaveType', [fn('COUNT', col('id')), 'count']],
    where: {
      ...leaveWhere,
      status: 'approved',
      createdAt: { [Op.gte]: new Date(`${y}-01-01`), [Op.lte]: new Date(`${y}-12-31`) }
    },
    group: ['leaveType']
  });

  const monthlyTrend = await Leave.findAll({
    attributes: [
      [fn('MONTH', col('start_date')), 'month'],
      [fn('COUNT', col('id')), 'count']
    ],
    where: {
      ...leaveWhere,
      status: 'approved',
      startDate: { [Op.gte]: new Date(`${y}-01-01`), [Op.lte]: new Date(`${y}-12-31`) }
    },
    group: ['month'],
    order: [[fn('MONTH', col('start_date')), 'ASC']]
  });

  const yearFilter = { createdAt: { [Op.gte]: new Date(`${y}-01-01`), [Op.lte]: new Date(`${y}-12-31`) } };
  const totalApproved = await Leave.count({ where: { ...leaveWhere, status: 'approved', ...yearFilter } });
  const totalPending = await Leave.count({ where: { ...leaveWhere, status: 'pending' } });
  const totalRejected = await Leave.count({ where: { ...leaveWhere, status: 'rejected', ...yearFilter } });

  res.json({
    success: true,
    data: { byStatus, byType, monthlyTrend, totals: { approved: totalApproved, pending: totalPending, rejected: totalRejected } }
  });
});

const getPayrollReport = asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  const m = month || new Date().getMonth() + 1;
  const y = year || new Date().getFullYear();

  const records = await Payroll.findAll({ where: { month: parseInt(m), year: parseInt(y) } });

  const totalGross = records.reduce((sum, r) => sum + parseFloat(r.grossPay || 0), 0);
  const totalDeductions = records.reduce((sum, r) => sum + parseFloat(r.totalDeductions || 0), 0);
  const totalNet = records.reduce((sum, r) => sum + parseFloat(r.netPay || 0), 0);
  const processed = records.filter(r => r.status === 'generated' || r.status === 'approved' || r.status === 'paid').length;
  const paid = records.filter(r => r.status === 'paid').length;
  const pending = records.filter(r => r.status === 'draft').length;

  res.json({
    success: true,
    data: {
      totals: { gross: totalGross, deductions: totalDeductions, net: totalNet },
      status: { processed, paid, pending, total: records.length },
      month: parseInt(m), year: parseInt(y)
    }
  });
});

const getRecruitmentReport = asyncHandler(async (req, res) => {
  const totalJobs = await Recruitment.count();
  const openJobs = await Recruitment.count({ where: { status: 'published' } });
  const draftJobs = await Recruitment.count({ where: { status: 'draft' } });
  const closedJobs = await Recruitment.count({ where: { status: 'closed' } });

  const totalCandidates = await Candidate.count();
  const byStatus = await Candidate.findAll({
    attributes: ['status', [fn('COUNT', col('id')), 'count']],
    group: ['status']
  });

  res.json({
    success: true,
    data: {
      jobs: { total: totalJobs, open: openJobs, draft: draftJobs, closed: closedJobs },
      candidates: { total: totalCandidates, byStatus }
    }
  });
});

const getPerformanceReport = asyncHandler(async (req, res) => {
  let perfWhere = {};

  if (req.user.role === 'manager') {
    const subIds = await getSubordinateIds(req.user.id);
    if (subIds) {
      perfWhere.employeeId = { [Op.in]: subIds };
    } else {
      return res.json({
        success: true,
        data: {
          totals: { total: 0, completed: 0, pending: 0 },
          averageRating: '0.0',
          byRating: [],
          byType: []
        }
      });
    }
  }

  const totalReviews = await PerformanceReview.count({ where: perfWhere });
  const completedReviews = await PerformanceReview.count({ where: { ...perfWhere, status: 'completed' } });
  const pendingReviews = await PerformanceReview.count({ where: { ...perfWhere, status: 'pending' } });

  const byRating = await PerformanceReview.findAll({
    attributes: ['overallRating', [fn('COUNT', col('id')), 'count']],
    where: { ...perfWhere, status: 'completed', overallRating: { [Op.ne]: null } },
    group: ['overallRating'],
    order: ['overallRating']
  });

  const avgRating = await PerformanceReview.findOne({
    attributes: [[fn('AVG', col('overall_rating')), 'average']],
    where: { ...perfWhere, status: 'completed', overallRating: { [Op.ne]: null } }
  });

  const byType = await PerformanceReview.findAll({
    attributes: ['reviewType', [fn('COUNT', col('id')), 'count']],
    where: perfWhere,
    group: ['reviewType']
  });

  res.json({
    success: true,
    data: {
      totals: { total: totalReviews, completed: completedReviews, pending: pendingReviews },
      averageRating: parseFloat(avgRating?.dataValues?.average || 0).toFixed(1),
      byRating,
      byType
    }
  });
});

module.exports = {
  getOverview,
  getEmployeeReports,
  getAttendanceReport,
  getLeaveReport,
  getPayrollReport,
  getRecruitmentReport,
  getPerformanceReport
};
