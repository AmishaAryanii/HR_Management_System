const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  getAttendances, getAttendance, checkIn, checkOut, breakIn, breakOut, getMonthlyReport, markAttendance
} = require('../controllers/attendanceController');

router.get('/', authenticate, getAttendances);
router.get('/monthly', authenticate, getMonthlyReport);
router.get('/:id', authenticate, getAttendance);
router.post('/check-in', authenticate, checkIn);
router.post('/check-out', authenticate, checkOut);
router.post('/break-in', authenticate, breakIn);
router.post('/break-out', authenticate, breakOut);
router.post('/mark', authenticate, authorize('admin'), markAttendance);

module.exports = router;
