const { Task, Employee, ActivityLog, Department, Sequelize } = require('../models');
const { asyncHandler } = require('../middleware/errorHandler');
const { notifyUser } = require('../services/notify');
const { Op } = Sequelize;

const getTasks = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, priority, assignedTo, assignedBy, departmentId, search } = req.query;
  const offset = (page - 1) * limit;
  const where = {};

  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (assignedTo) where.assignedTo = assignedTo;
  if (assignedBy) where.assignedBy = assignedBy;
  if (departmentId) where.departmentId = departmentId;
  if (search) where.title = { [Op.like]: `%${search}%` };

  // Role-based
  if (req.user.role === 'employee') {
    const emp = await Employee.findOne({ where: { userId: req.user.id } });
    if (emp) where.assignedTo = emp.id;
  } else if (req.user.role === 'manager') {
    const emp = await Employee.findOne({ where: { userId: req.user.id } });
    if (emp) {
      const subordinates = await Employee.findAll({ where: { reportingManagerId: emp.id }, attributes: ['id'] });
      const subIds = subordinates.map(s => s.id);
      // Team view: only subordinates by default
      // If a specific assignedTo is requested and is a subordinate OR the manager themself, use it directly
      if (assignedTo && (subIds.includes(parseInt(assignedTo)) || parseInt(assignedTo) === emp.id)) {
        where.assignedTo = parseInt(assignedTo);
      } else if (subIds.length > 0) {
        where.assignedTo = { [Op.in]: subIds };
      } else {
        return res.json({ success: true, data: [], pagination: { total: 0, page: parseInt(page), limit: parseInt(limit), totalPages: 0 } });
      }
    }
  }

  const { count, rows } = await Task.findAndCountAll({
    where,
    include: [
      { model: Employee, as: 'assignee', attributes: ['id', 'firstName', 'lastName', 'employeeId'] },
      { model: Employee, as: 'assigner', attributes: ['id', 'firstName', 'lastName', 'employeeId'] },
      { model: Department, as: 'department', attributes: ['id', 'name'] }
    ],
    order: [['createdAt', 'DESC']],
    limit: parseInt(limit),
    offset: parseInt(offset)
  });

  res.json({ success: true, data: rows, pagination: { total: count, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(count / limit) } });
});

const getTask = asyncHandler(async (req, res) => {
  const task = await Task.findByPk(req.params.id, { include: [{ association: 'assignee' }, { association: 'assigner' }, { association: 'department' }] });
  if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

  // Role-based scoping
  if (req.user.role === 'employee') {
    const emp = await Employee.findOne({ where: { userId: req.user.id } });
    if (!emp || task.assignedTo !== emp.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this task' });
    }
  } else if (req.user.role === 'manager') {
    const emp = await Employee.findOne({ where: { userId: req.user.id } });
    if (!emp) return res.status(404).json({ success: false, message: 'Employee not found' });
    const subordinates = await Employee.findAll({ where: { reportingManagerId: emp.id }, attributes: ['id'] });
    const subIds = subordinates.map(s => s.id);
    // Allow if it's their own task or one of their subordinates'
    if (task.assignedTo !== emp.id && !subIds.includes(task.assignedTo)) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this task' });
    }
  }

  res.json({ success: true, data: task });
});

const createTask = asyncHandler(async (req, res) => {
  const emp = await Employee.findOne({ where: { userId: req.user.id } });
  if (!emp) return res.status(404).json({ success: false, message: 'Employee not found' });

  const { title, description, priority, assignedTo, dueDate, category } = req.body;
  const task = await Task.create({ title, description, priority, assignedTo, dueDate, category, assignedBy: emp.id, departmentId: emp.departmentId });

  // Notify assignee
  const assignee = await Employee.findByPk(assignedTo, { include: [{ association: 'user' }] });
  if (assignee?.user) {
    await notifyUser({
      userId: assignee.user.id,
      employeeId: assignee.id,
      type: 'task_assigned',
      title: 'New Task Assigned',
      message: `You have been assigned: ${title}`,
      actionUrl: `/tasks/${task.id}`
    });
  }

  res.status(201).json({ success: true, message: 'Task created successfully', data: task });
});

const updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findByPk(req.params.id);
  if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

  // Role-based authorization for task update
  if (req.user.role === 'employee') {
    const emp = await Employee.findOne({ where: { userId: req.user.id } });
    if (!emp || task.assignedTo !== emp.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this task' });
    }
  } else if (req.user.role === 'manager') {
    const emp = await Employee.findOne({ where: { userId: req.user.id } });
    if (emp) {
      const subordinates = await Employee.findAll({ where: { reportingManagerId: emp.id }, attributes: ['id'] });
      const subIds = subordinates.map(s => s.id);
      if (task.assignedTo !== emp.id && task.assignedBy !== emp.id && !subIds.includes(task.assignedTo) && !subIds.includes(task.assignedBy)) {
        return res.status(403).json({ success: false, message: 'Not authorized to update this task' });
      }
    }
  }
  // Admin/super_admin can update any task

  await task.update(req.body);
  res.json({ success: true, message: 'Task updated', data: task });
});

const updateTaskStatus = asyncHandler(async (req, res) => {
  const task = await Task.findByPk(req.params.id);
  if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

  // Role-based authorization for task status update
  // Employees can only update their own tasks, managers can update team tasks, admins can update any
  if (req.user.role === 'employee') {
    const emp = await Employee.findOne({ where: { userId: req.user.id } });
    if (!emp || task.assignedTo !== emp.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this task status' });
    }
  } else if (req.user.role === 'manager') {
    const emp = await Employee.findOne({ where: { userId: req.user.id } });
    if (emp) {
      const subordinates = await Employee.findAll({ where: { reportingManagerId: emp.id }, attributes: ['id'] });
      const subIds = subordinates.map(s => s.id);
      if (task.assignedTo !== emp.id && !subIds.includes(task.assignedTo)) {
        return res.status(403).json({ success: false, message: 'Not authorized to update this task status' });
      }
    }
  }

  const { status, progress } = req.body;
  const updateData = { status };
  if (progress !== undefined) updateData.progress = progress;
  if (status === 'completed') { updateData.completedAt = new Date(); }
  if (status === 'verified') { updateData.verifiedBy = req.user.id; updateData.verifiedAt = new Date(); }
  if (progress === 100) { updateData.status = 'completed'; updateData.completedAt = new Date(); }

  await task.update(updateData);

  // Notifications based on status changes
  if (task.status === 'completed') {
    const assigner = await Employee.findByPk(task.assignedBy, { include: [{ association: 'user' }] });
    if (assigner?.user) {
      await notifyUser({
        userId: assigner.user.id,
        employeeId: assigner.id,
        type: 'task_completed',
        title: 'Task Completed',
        message: `Task "${task.title}" has been marked as completed`,
        actionUrl: `/tasks/${task.id}`
      });
    }
  } else if (task.status === 'verified') {
    const assignee = await Employee.findByPk(task.assignedTo, { include: [{ association: 'user' }] });
    if (assignee?.user) {
      await notifyUser({
        userId: assignee.user.id,
        employeeId: assignee.id,
        type: 'task_completed',
        title: 'Task Verified',
        message: `Task "${task.title}" has been verified and closed.`,
        actionUrl: `/tasks/${task.id}`
      });
    }
  }

  res.json({ success: true, message: 'Task status updated', data: task });
});

const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findByPk(req.params.id);
  if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
  await task.destroy();
  res.json({ success: true, message: 'Task deleted' });
});

module.exports = { getTasks, getTask, createTask, updateTask, updateTaskStatus, deleteTask };
