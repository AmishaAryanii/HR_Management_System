const { User } = require('../models');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * GET /api/notifications/preferences
 * Get the current user's notification preferences
 */
const getPreferences = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id, {
    attributes: ['id', 'notificationPreferences']
  });

  const defaults = {
    emailNotifications: true,
    leaveApprovalAlerts: true,
    taskReminders: true
  };

  const preferences = user?.notificationPreferences || defaults;

  res.json({ success: true, data: preferences });
});

/**
 * PUT /api/notifications/preferences
 * Update the current user's notification preferences
 */
const updatePreferences = asyncHandler(async (req, res) => {
  const { emailNotifications, leaveApprovalAlerts, taskReminders } = req.body;

  const preferences = {
    emailNotifications: emailNotifications !== undefined ? Boolean(emailNotifications) : true,
    leaveApprovalAlerts: leaveApprovalAlerts !== undefined ? Boolean(leaveApprovalAlerts) : true,
    taskReminders: taskReminders !== undefined ? Boolean(taskReminders) : true
  };

  await User.update(
    { notificationPreferences: preferences },
    { where: { id: req.user.id } }
  );

  res.json({ success: true, message: 'Notification preferences updated', data: preferences });
});

module.exports = { getPreferences, updatePreferences };
