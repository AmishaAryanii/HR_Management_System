const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { getTimesheets, createTimesheet, updateTimesheetStatus, deleteTimesheet } = require('../controllers/timesheetController');

router.use(authenticate);

router.get('/', getTimesheets);
router.post('/', createTimesheet);
router.put('/:id/status', authorize('super_admin', 'admin', 'manager'), updateTimesheetStatus);
router.delete('/:id', deleteTimesheet);

module.exports = router;
