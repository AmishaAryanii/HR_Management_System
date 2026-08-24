const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  getLeaves, getLeave, applyLeave, approveByManager, approveByAdmin, rejectLeave, cancelLeave, getLeaveBalances
} = require('../controllers/leaveController');

router.get('/balances', authenticate, getLeaveBalances);
router.get('/', authenticate, getLeaves);
router.get('/:id', authenticate, getLeave);
router.post('/', authenticate, applyLeave);
router.put('/:id/approve-manager', authenticate, authorize('manager', 'admin', 'super_admin'), approveByManager);
router.put('/:id/approve-admin', authenticate, authorize('admin', 'super_admin'), approveByAdmin);
router.put('/:id/reject', authenticate, authorize('manager', 'admin', 'super_admin'), rejectLeave);
router.put('/:id/cancel', authenticate, cancelLeave);

module.exports = router;
