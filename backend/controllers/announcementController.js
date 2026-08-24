const { Announcement, Employee, Department, ActivityLog, Sequelize } = require('../models');
const { asyncHandler } = require('../middleware/errorHandler');
const { notifyMany } = require('../services/notify');
const { Op } = Sequelize;

const getAnnouncements = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, type, status = 'published', departmentId } = req.query;
  const offset = (page - 1) * limit;
  const where = { status };
  if (type) where.type = type;
  if (departmentId) where.departmentId = departmentId;

  const { count, rows } = await Announcement.findAndCountAll({
    where,
    include: [{ model: Employee, as: 'creator', attributes: ['id', 'firstName', 'lastName', 'employeeId'] }, { model: Department, as: 'department', attributes: ['id', 'name'] }],
    order: [['createdAt', 'DESC']],
    limit: parseInt(limit),
    offset: parseInt(offset)
  });

  res.json({ success: true, data: rows, pagination: { total: count, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(count / limit) } });
});

const getAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findByPk(req.params.id, { include: [{ association: 'creator' }, { association: 'department' }] });
  if (!announcement) return res.status(404).json({ success: false, message: 'Announcement not found' });
  res.json({ success: true, data: announcement });
});

const createAnnouncement = asyncHandler(async (req, res) => {
  const emp = await Employee.findOne({ where: { userId: req.user.id } });
  if (!emp) return res.status(404).json({ success: false, message: 'Employee not found' });

  const { title, content, type, priority, departmentId, expiresAt } = req.body;
  const announcement = await Announcement.create({ title, content, type, priority, departmentId, createdBy: emp.id, publishedAt: new Date(), expiresAt });

  // Create notifications for all active employees
  try {
    const whereEmployee = { employmentStatus: 'active' };
    if (type === 'department' && departmentId) {
      whereEmployee.departmentId = departmentId;
    }
    const employees = await Employee.findAll({ where: whereEmployee, attributes: ['id', 'userId'] });
    const recipients = employees
      .filter(e => e.userId && e.userId !== req.user.id) // Don't notify the creator
      .map(e => ({ userId: e.userId, employeeId: e.id }));
    if (recipients.length > 0) {
      await notifyMany({
        recipients,
        type: 'announcement',
        title: title,
        message: content?.substring(0, 200) || 'New announcement',
        data: { announcementId: announcement.id, priority },
        actionUrl: '/announcements'
      });
    }
  } catch (notifErr) {
    console.error('Failed to send announcement notifications:', notifErr.message);
  }

  res.status(201).json({ success: true, message: 'Announcement created', data: announcement });
});

const updateAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findByPk(req.params.id);
  if (!announcement) return res.status(404).json({ success: false, message: 'Announcement not found' });
  await announcement.update(req.body);
  res.json({ success: true, message: 'Announcement updated', data: announcement });
});

const deleteAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findByPk(req.params.id);
  if (!announcement) return res.status(404).json({ success: false, message: 'Announcement not found' });
  await announcement.update({ status: 'archived' });
  res.json({ success: true, message: 'Announcement archived' });
});

module.exports = { getAnnouncements, getAnnouncement, createAnnouncement, updateAnnouncement, deleteAnnouncement };
