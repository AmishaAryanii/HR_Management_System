const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { getDepartments, getDepartment, createDepartment, updateDepartment, deleteDepartment } = require('../controllers/departmentController');

router.get('/', authenticate, getDepartments);
router.get('/:id', authenticate, getDepartment);
router.post('/', authenticate, authorize('super_admin', 'admin'), createDepartment);
router.put('/:id', authenticate, authorize('super_admin', 'admin'), updateDepartment);
router.delete('/:id', authenticate, authorize('super_admin'), deleteDepartment);

module.exports = router;
