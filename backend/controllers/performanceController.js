const { PerformanceReview, Employee, ActivityLog, User, Sequelize } = require('../models');
const { asyncHandler } = require('../middleware/errorHandler');
const { notifyUser } = require('../services/notify');
const { Op } = Sequelize;

const getReviews = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, employeeId, reviewerId, reviewType } = req.query;
  const offset = (page - 1) * limit;
  const where = {};
  if (status) where.status = status;
  if (employeeId) where.employeeId = employeeId;
  if (reviewerId) where.reviewerId = reviewerId;
  if (reviewType) where.reviewType = reviewType;

  if (req.user.role === 'employee') {
    const emp = await Employee.findOne({ where: { userId: req.user.id } });
    if (emp) where.employeeId = emp.id;
  } else if (req.user.role === 'manager') {
    const emp = await Employee.findOne({ where: { userId: req.user.id } });
    if (emp) {
      const subordinates = await Employee.findAll({ where: { reportingManagerId: emp.id }, attributes: ['id'] });
      const subIds = subordinates.map(s => s.id);
      // If a specific employeeId is requested and is a subordinate OR the manager themself, use it directly
      if (employeeId && (subIds.includes(parseInt(employeeId)) || parseInt(employeeId) === emp.id)) {
        where.employeeId = parseInt(employeeId);
      } else if (subIds.length > 0) {
        where.employeeId = { [Op.in]: subIds };
      } else {
        return res.json({ success: true, data: [], pagination: { total: 0, page: parseInt(page), limit: parseInt(limit), totalPages: 0 } });
      }
    }
  }

  const { count, rows } = await PerformanceReview.findAndCountAll({
    where,
    include: [
      { model: Employee, as: 'employee', attributes: ['id', 'firstName', 'lastName', 'employeeId'] },
      { model: Employee, as: 'reviewer', attributes: ['id', 'firstName', 'lastName', 'employeeId'] }
    ],
    order: [['createdAt', 'DESC']],
    limit: parseInt(limit),
    offset: parseInt(offset)
  });

  res.json({ success: true, data: rows, pagination: { total: count, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(count / limit) } });
});

const getReview = asyncHandler(async (req, res) => {
  const review = await PerformanceReview.findByPk(req.params.id, { include: [{ association: 'employee' }, { association: 'reviewer' }] });
  if (!review) return res.status(404).json({ success: false, message: 'Review not found' });

  // Role-based scoping
  if (req.user.role === 'employee') {
    const emp = await Employee.findOne({ where: { userId: req.user.id } });
    if (!emp || review.employeeId !== emp.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this review' });
    }
  } else if (req.user.role === 'manager') {
    const emp = await Employee.findOne({ where: { userId: req.user.id } });
    if (!emp) return res.status(404).json({ success: false, message: 'Employee not found' });
    const subordinates = await Employee.findAll({ where: { reportingManagerId: emp.id }, attributes: ['id'] });
    const subIds = subordinates.map(s => s.id);
    // Allow if it's their own review or one of their subordinates'
    if (review.employeeId !== emp.id && !subIds.includes(review.employeeId)) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this review' });
    }
  }

  res.json({ success: true, data: review });
});

const createReview = asyncHandler(async (req, res) => {
  const emp = await Employee.findOne({ where: { userId: req.user.id } });
  if (!emp) return res.status(404).json({ success: false, message: 'Employee not found' });

  const targetEmployee = await Employee.findByPk(req.body.employeeId, {
    include: [{ model: User, as: 'user', attributes: ['role'] }]
  });
  if (!targetEmployee) return res.status(404).json({ success: false, message: 'Target employee not found' });

  // Managers can only review their team members
  if (req.user.role === 'manager') {
    // Check if target employee reports to this manager
    if (targetEmployee.reportingManagerId !== emp.id) {
      return res.status(403).json({ success: false, message: 'You can only review employees in your team' });
    }
    // Managers cannot review admin users
    if (targetEmployee.user && targetEmployee.user.role === 'admin') {
      return res.status(403).json({ success: false, message: 'You cannot review administrators' });
    }
  }

  const review = await PerformanceReview.create({
    ...req.body,
    reviewerId: emp.id,
    reviewerRole: req.user.role
  });

  // Notify employee whose performance is being reviewed
  if (targetEmployee?.userId) {
    await notifyUser({
      userId: targetEmployee.userId,
      employeeId: targetEmployee.id,
      type: 'review_added',
      title: 'Performance Review Added',
      message: `A ${req.body.reviewType || ''} performance review has been created for you by ${emp.firstName} ${emp.lastName}.`,
      actionUrl: '/performance'
    });
  }

  res.status(201).json({ success: true, message: 'Review created', data: review });
});

const updateReview = asyncHandler(async (req, res) => {
  const review = await PerformanceReview.findByPk(req.params.id);
  if (!review) return res.status(404).json({ success: false, message: 'Review not found' });

  const updateData = { ...req.body };
  if (req.body.status === 'completed' || (req.body.overallRating && req.body.feedback)) {
    updateData.status = 'completed';
    updateData.completedAt = new Date();
  }

  await review.update(updateData);
  res.json({ success: true, message: 'Review updated', data: review });
});

const getPerformanceStats = asyncHandler(async (req, res) => {
  let where = { status: 'completed' };

  // Manager scoping
  if (req.user.role === 'manager') {
    const emp = await Employee.findOne({ where: { userId: req.user.id } });
    if (emp) {
      const subordinates = await Employee.findAll({ where: { reportingManagerId: emp.id }, attributes: ['id'] });
      const subIds = subordinates.map(s => s.id);
      if (subIds.length > 0) {
        where.employeeId = { [Op.in]: subIds };
      } else {
        return res.json({ success: true, data: { stats: [], distribution: [] } });
      }
    }
  }

  const stats = await PerformanceReview.findAll({
    attributes: [
      'reviewType',
      [Sequelize.fn('AVG', Sequelize.col('overallRating')), 'avgRating'],
      [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
    ],
    where,
    group: ['reviewType']
  });

  const distribution = await PerformanceReview.findAll({
    attributes: ['overallRating', [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']],
    where: { ...where, overallRating: { [Op.ne]: null } },
    group: ['overallRating'],
    order: ['overallRating']
  });

  res.json({ success: true, data: { stats, distribution } });
});

module.exports = { getReviews, getReview, createReview, updateReview, getPerformanceStats };
