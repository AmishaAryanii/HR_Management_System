const { Announcement, Employee, Department, ActivityLog, Sequelize } = require('../models');
const { asyncHandler } = require('../middleware/errorHandler');
const { notifyMany } = require('../services/notify');
const { Op } = Sequelize;

/**
 * Helper: check that the current user is admin or super_admin.
 * Returns { ok: true } or sends a 403 response and returns { ok: false }.
 */
const requireAdmin = (req, res) => {
  if (!['super_admin', 'admin'].includes(req.user.role)) {
    res.status(403).json({ success: false, message: 'Only admins can perform this action.' });
    return false;
  }
  return true;
};

/**
 * GET /api/announcements
 * All authenticated users can list announcements (filtered by status).
 * Managers and Employees only see published announcements by default;
 * Admins can optionally filter by status via query param.
 */
const getAnnouncements = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, type, status, departmentId } = req.query;
  const offset = (page - 1) * limit;

  // Non-admin users can only see published announcements
  const isAdmin = ['super_admin', 'admin'].includes(req.user.role);
  const where = {};

  if (status) {
    where.status = status;
  } else if (!isAdmin) {
    where.status = 'published';
  }

  if (type) where.type = type;
  if (departmentId) where.departmentId = departmentId;

  const { count, rows } = await Announcement.findAndCountAll({
    where,
    include: [
      { model: Employee, as: 'creator', attributes: ['id', 'firstName', 'lastName', 'employeeId'] },
      { model: Department, as: 'department', attributes: ['id', 'name'] }
    ],
    order: [['createdAt', 'DESC']],
    limit: parseInt(limit),
    offset: parseInt(offset)
  });

  res.json({
    success: true,
    data: rows,
    pagination: {
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit)
    }
  });
});

/**
 * GET /api/announcements/:id
 * All authenticated users can view announcement details.
 */
const getAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findByPk(req.params.id, {
    include: [
      { association: 'creator' },
      { association: 'department' }
    ]
  });
  if (!announcement) {
    return res.status(404).json({ success: false, message: 'Announcement not found' });
  }
  res.json({ success: true, data: announcement });
});

/**
 * POST /api/announcements
 * Only admin / super_admin can create an announcement.
 */
const createAnnouncement = asyncHandler(async (req, res) => {
  if (!requireAdmin(req, res)) return;

  const emp = await Employee.findOne({ where: { userId: req.user.id } });
  if (!emp) {
    return res.status(404).json({ success: false, message: 'Employee record not found for the current user' });
  }

  const { title, content, type, priority, departmentId, expiresAt, status } = req.body;

  const announcement = await Announcement.create({
    title,
    content,
    type,
    priority,
    departmentId,
    createdBy: emp.id,
    status: status || 'draft',
    publishedAt: status === 'published' ? new Date() : null,
    expiresAt
  });

  // Notify recipients only if published immediately
  if (announcement.status === 'published') {
    await sendAnnouncementNotifications(announcement, title, content, type, departmentId, req.user.id);
  }

  await ActivityLog.create({
    userId: req.user.id,
    action: 'ANNOUNCEMENT_CREATED',
    resource: 'announcement',
    description: `Created announcement: ${title}`,
    severity: 'info'
  });

  res.status(201).json({
    success: true,
    message: 'Announcement created successfully',
    data: announcement
  });
});

/**
 * PUT /api/announcements/:id
 * Only admin / super_admin can update an announcement.
 */
const updateAnnouncement = asyncHandler(async (req, res) => {
  if (!requireAdmin(req, res)) return;

  const announcement = await Announcement.findByPk(req.params.id);
  if (!announcement) {
    return res.status(404).json({ success: false, message: 'Announcement not found' });
  }

  const { title, content, type, priority, departmentId, expiresAt } = req.body;
  await announcement.update({ title, content, type, priority, departmentId, expiresAt });

  await ActivityLog.create({
    userId: req.user.id,
    action: 'ANNOUNCEMENT_UPDATED',
    resource: 'announcement',
    description: `Updated announcement: ${announcement.title}`,
    severity: 'info'
  });

  res.json({ success: true, message: 'Announcement updated successfully', data: announcement });
});

/**
 * DELETE /api/announcements/:id
 * Only admin / super_admin can archive (soft-delete) an announcement.
 */
const deleteAnnouncement = asyncHandler(async (req, res) => {
  if (!requireAdmin(req, res)) return;

  const announcement = await Announcement.findByPk(req.params.id);
  if (!announcement) {
    return res.status(404).json({ success: false, message: 'Announcement not found' });
  }

  await announcement.update({ status: 'archived' });

  await ActivityLog.create({
    userId: req.user.id,
    action: 'ANNOUNCEMENT_DELETED',
    resource: 'announcement',
    description: `Archived announcement: ${announcement.title}`,
    severity: 'warning'
  });

  res.json({ success: true, message: 'Announcement archived successfully' });
});

/**
 * PUT /api/announcements/:id/publish
 * Only admin / super_admin can publish a draft announcement.
 */
const publishAnnouncement = asyncHandler(async (req, res) => {
  if (!requireAdmin(req, res)) return;

  const announcement = await Announcement.findByPk(req.params.id);
  if (!announcement) {
    return res.status(404).json({ success: false, message: 'Announcement not found' });
  }

  if (announcement.status === 'published') {
    return res.status(400).json({ success: false, message: 'Announcement is already published' });
  }

  await announcement.update({ status: 'published', publishedAt: new Date() });

  // Send notifications now that it's published
  await sendAnnouncementNotifications(
    announcement, announcement.title, announcement.content,
    announcement.type, announcement.departmentId, req.user.id
  );

  await ActivityLog.create({
    userId: req.user.id,
    action: 'ANNOUNCEMENT_PUBLISHED',
    resource: 'announcement',
    description: `Published announcement: ${announcement.title}`,
    severity: 'info'
  });

  res.json({ success: true, message: 'Announcement published successfully', data: announcement });
});

/**
 * PUT /api/announcements/:id/unpublish
 * Only admin / super_admin can unpublish (revert to draft).
 */
const unpublishAnnouncement = asyncHandler(async (req, res) => {
  if (!requireAdmin(req, res)) return;

  const announcement = await Announcement.findByPk(req.params.id);
  if (!announcement) {
    return res.status(404).json({ success: false, message: 'Announcement not found' });
  }

  if (announcement.status !== 'published') {
    return res.status(400).json({ success: false, message: 'Announcement is not currently published' });
  }

  await announcement.update({ status: 'draft', publishedAt: null });

  await ActivityLog.create({
    userId: req.user.id,
    action: 'ANNOUNCEMENT_UNPUBLISHED',
    resource: 'announcement',
    description: `Unpublished announcement: ${announcement.title}`,
    severity: 'info'
  });

  res.json({ success: true, message: 'Announcement unpublished successfully', data: announcement });
});

/**
 * Helper: Send notification emails to relevant employees for a published announcement.
 */
async function sendAnnouncementNotifications(announcement, title, content, type, departmentId, creatorUserId) {
  try {
    const whereEmployee = { employmentStatus: 'active' };
    if (type === 'department' && departmentId) {
      whereEmployee.departmentId = departmentId;
    }
    const employees = await Employee.findAll({
      where: whereEmployee,
      attributes: ['id', 'userId']
    });
    const recipients = employees
      .filter(e => e.userId && e.userId !== creatorUserId)
      .map(e => ({ userId: e.userId, employeeId: e.id }));

    if (recipients.length > 0) {
      await notifyMany({
        recipients,
        type: 'announcement',
        title,
        message: content?.substring(0, 200) || 'New announcement',
        data: { announcementId: announcement.id, priority: announcement.priority },
        actionUrl: '/announcements'
      });
    }
  } catch (err) {
    console.error('Failed to send announcement notifications:', err.message);
  }
}

module.exports = {
  getAnnouncements,
  getAnnouncement,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  publishAnnouncement,
  unpublishAnnouncement
};
