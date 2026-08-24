const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  getEmployees,
  getEmployeesLite,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeeStats,
  updateUserRole,
  uploadProfilePhoto,
  updateSelf,
  getMyTeam
} = require('../controllers/employeeController');

router.get('/stats', authenticate, authorize('super_admin', 'admin'), getEmployeeStats);
router.get('/lite', authenticate, getEmployeesLite);
router.get('/my-team', authenticate, getMyTeam);
router.get('/', authenticate, getEmployees);
router.get('/:id', authenticate, getEmployee);
router.post('/', authenticate, authorize('super_admin', 'admin'), upload.single('profilePhoto'), createEmployee);
// Self-update routes must be BEFORE /:id PUT to avoid :id catching 'profile'
router.put('/profile/photo', authenticate, upload.single('profilePhoto'), uploadProfilePhoto);
router.put('/profile', authenticate, updateSelf);
router.put('/:id/role', authenticate, authorize('super_admin', 'admin'), updateUserRole);
router.put('/:id', authenticate, authorize('super_admin', 'admin'), upload.single('profilePhoto'), updateEmployee);
router.delete('/:id', authenticate, authorize('super_admin', 'admin'), deleteEmployee);

module.exports = router;
