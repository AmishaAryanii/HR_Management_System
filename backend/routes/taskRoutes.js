const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { getTasks, getTask, createTask, updateTask, updateTaskStatus, deleteTask } = require('../controllers/taskController');

router.get('/', authenticate, getTasks);
router.get('/:id', authenticate, getTask);
router.post('/', authenticate, authorize('admin', 'manager'), createTask);
router.put('/:id', authenticate, authorize('admin', 'manager'), updateTask);
router.put('/:id/status', authenticate, authorize('admin', 'manager', 'employee'), updateTaskStatus);
router.delete('/:id', authenticate, authorize('admin'), deleteTask);

module.exports = router;
