const { Notification } = require('../models');
const { asyncHandler } = require('../middleware/errorHandler');

const getNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, isRead } = req.query;
  const offset = (page - 1) * limit;
  const where = { userId: req.user.id };
  if (isRead !== undefined) where.isRead = isRead === 'true';

  const { count, rows } = await Notification.findAndCountAll({
    where,
    order: [['createdAt', 'DESC']],
    limit: parseInt(limit),
    offset: parseInt(offset)
  });

  const unreadCount = await Notification.count({ where: { userId: req.user.id, isRead: false } });

  res.json({ success: true, data: rows, unreadCount, pagination: { total: count, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(count / limit) } });
});

const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({ where: { id: req.params.id, userId: req.user.id } });
  if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
  await notification.update({ isRead: true, readAt: new Date() });
  res.json({ success: true, message: 'Marked as read', data: notification });
});

const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.update({ isRead: true, readAt: new Date() }, { where: { userId: req.user.id, isRead: false } });
  res.json({ success: true, message: 'All notifications marked as read' });
});

const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({ where: { id: req.params.id, userId: req.user.id } });
  if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
  await notification.destroy();
  res.json({ success: true, message: 'Notification deleted' });
});

module.exports = { getNotifications, markAsRead, markAllAsRead, deleteNotification };
