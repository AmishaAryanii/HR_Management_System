const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { getTasks, getTask, createTask, updateTask, updateTaskStatus, deleteTask } = require('../controllers/taskController');

router.get('/', authenticate, getTasks);
router.get('/:id', authenticate, getTask);
router.post('/', authenticate, authorize('super_admin', 'admin', 'manager'), createTask);
router.put('/:id', authenticate, authorize('super_admin', 'admin', 'manager'), updateTask);
router.put('/:id/status', authenticate, authorize('super_admin', 'admin', 'manager', 'employee'), updateTaskStatus);
router.delete('/:id', authenticate, authorize('super_admin', 'admin'), deleteTask);

module.exports = router;
