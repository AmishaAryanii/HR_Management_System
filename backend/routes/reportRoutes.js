const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  getOverview,
  getEmployeeReports,
  getAttendanceReport,
  getLeaveReport,
  getPayrollReport,
  getRecruitmentReport,
  getPerformanceReport
} = require('../controllers/reportController');

// All report routes require authentication
router.use(authenticate);

// Reports - accessible by super_admin, admin, and manager
router.get('/overview', authorize('super_admin', 'admin', 'manager'), getOverview);
router.get('/employees', authorize('super_admin', 'admin', 'manager'), getEmployeeReports);
router.get('/attendance', authorize('super_admin', 'admin', 'manager'), getAttendanceReport);
router.get('/leaves', authorize('super_admin', 'admin', 'manager'), getLeaveReport);
router.get('/payroll', authorize('super_admin', 'admin'), getPayrollReport);
router.get('/recruitment', authorize('super_admin', 'admin'), getRecruitmentReport);
router.get('/performance', authorize('super_admin', 'admin', 'manager'), getPerformanceReport);

module.exports = router;
