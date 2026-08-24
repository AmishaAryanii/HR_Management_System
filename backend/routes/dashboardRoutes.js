const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { getSuperAdminDashboard, getAdminDashboard, getManagerDashboard, getEmployeeDashboard } = require('../controllers/dashboardController');

router.get('/super-admin', authenticate, authorize('super_admin'), getSuperAdminDashboard);
router.get('/admin', authenticate, authorize('admin', 'super_admin'), getAdminDashboard);
router.get('/manager', authenticate, authorize('manager', 'admin', 'super_admin'), getManagerDashboard);
router.get('/employee', authenticate, getEmployeeDashboard);

module.exports = router;
