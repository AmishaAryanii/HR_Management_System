const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { getAdminDashboard, getManagerDashboard, getEmployeeDashboard } = require('../controllers/dashboardController');

router.get('/admin', authenticate, authorize('admin'), getAdminDashboard);
router.get('/manager', authenticate, authorize('manager', 'admin'), getManagerDashboard);
router.get('/employee', authenticate, getEmployeeDashboard);

module.exports = router;
