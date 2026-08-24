const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { getPayrolls, processPayroll, getPayslips, getPayslip, approvePayroll, markPaid, downloadPayslipPDF } = require('../controllers/payrollController');

router.get('/', authenticate, authorize('super_admin', 'admin'), getPayrolls);
router.post('/process', authenticate, authorize('super_admin', 'admin'), processPayroll);
router.put('/:id/approve', authenticate, authorize('super_admin', 'admin'), approvePayroll);
router.put('/:id/mark-paid', authenticate, authorize('super_admin', 'admin'), markPaid);
router.get('/payslips', authenticate, getPayslips);
router.get('/payslips/:id', authenticate, getPayslip);
router.get('/payslips/:id/pdf', authenticate, downloadPayslipPDF);

module.exports = router;
