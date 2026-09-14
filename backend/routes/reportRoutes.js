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

// Reports - accessible by admin and manager
router.get('/overview', authorize('admin', 'manager'), getOverview);
router.get('/employees', authorize('admin', 'manager'), getEmployeeReports);
router.get('/attendance', authorize('admin', 'manager'), getAttendanceReport);
router.get('/leaves', authorize('admin', 'manager'), getLeaveReport);
router.get('/payroll', authorize('admin'), getPayrollReport);
router.get('/recruitment', authorize('admin'), getRecruitmentReport);
router.get('/performance', authorize('admin', 'manager'), getPerformanceReport);

module.exports = router;
