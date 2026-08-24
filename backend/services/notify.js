const { Notification, Employee, User } = require('../models');
const { sendEmail } = require('./email');

/**
 * Centralized notification helper.
 * Sends both an in-app notification (Notification.create) and an email
 * (if the target user has an email address).
 *
 * @param {Object} options
 * @param {number}   options.userId       - Required. The User who should receive the notification.
 * @param {number}   [options.employeeId] - Optional. Employee record id for reference.
 * @param {string}   options.type         - Notification type (must be in Notification.rawAttributes.type.values).
 * @param {string}   options.title        - Short title.
 * @param {string}   options.message      - Longer message body.
 * @param {Object}   [options.data]       - Optional JSON-serialisable metadata.
 * @param {string}   [options.actionUrl]  - Optional frontend URL for deep-linking.
 * @param {boolean}  [options.skipEmail]  - If true, skip sending the email.
 * @param {string}   [options.responsibleUser] - Who performed this action (e.g. 'John Smith' or 'System').
 * @param {string}   [options.responsibleRole] - Role of the responsible user.
 * @param {Buffer}   [options.attachment] - Optional PDF or other binary attachment.
 * @param {string}   [options.attachmentFilename] - Filename for the attachment.
 * @returns {Promise<Object>} { notification, emailResult }
 */
async function notifyUser({
  userId,
  employeeId,
  type,
  title,
  message,
  data,
  actionUrl,
  skipEmail,
  responsibleUser,
  responsibleRole,
  attachment,
  attachmentFilename
}) {
  const result = { notification: null, emailResult: null };

  if (!userId) {
    console.warn('[notify] No userId provided, skipping');
    return result;
  }

  // 1. Create in-app notification
  try {
    result.notification = await Notification.create({
      userId,
      employeeId,
      type,
      title,
      message,
      data: data || null,
      actionUrl: actionUrl || null
    });
  } catch (err) {
    console.error('[notify] Failed to create in-app notification:', err.message);
  }

  // 2. Check user's notification preferences before sending email
  if (!skipEmail) {
    try {
      const user = await User.findByPk(userId, { attributes: ['id', 'email', 'notificationPreferences'] });
      if (user && user.email) {
        // Respect user's email notification preferences
        const prefs = user.notificationPreferences || {};
        const notificationType = type;
        const emailPrefKey = getEmailPrefKey(notificationType);
        if (emailPrefKey && prefs[emailPrefKey] === false) {
          // User has opted out of this notification type — skip email
          return result;
        }
        const emailHtml = buildEmailHtml({ title, message, type, actionUrl, responsibleUser, responsibleRole });
        const mailOptions = {
          to: user.email,
          subject: title,
          html: emailHtml
        };
        if (attachment && attachmentFilename) {
          mailOptions.attachments = [{ filename: attachmentFilename, content: attachment }];
        }
        result.emailResult = await sendEmail(mailOptions);
      }
    } catch (err) {
      console.error('[notify] Failed to send email:', err.message);
    }
  }

  return result;
}

/**
 * Notify MULTIPLE users at once. Pass an array of { userId, employeeId? } objects.
 * Each receives the same title/message/type.
 */
async function notifyMany({
  recipients, // [{ userId, employeeId? }, ...]
  type,
  title,
  message,
  data,
  actionUrl,
  skipEmail,
  responsibleUser,
  responsibleRole
}) {
  const results = [];

  if (!recipients || recipients.length === 0) return results;

  // Batch-create in-app notifications
  const notificationRows = recipients
    .filter(r => r.userId)
    .map(r => ({
      userId: r.userId,
      employeeId: r.employeeId || null,
      type,
      title,
      message,
      data: data || null,
      actionUrl: actionUrl || null
    }));

  if (notificationRows.length > 0) {
    try {
      await Notification.bulkCreate(notificationRows);
    } catch (err) {
      console.error('[notify] Failed to batch-create notifications:', err.message);
    }
  }

  // Send individual emails (respecting user preferences)
  if (!skipEmail) {
    for (const r of recipients) {
      if (!r.userId) continue;
      try {
        const user = await User.findByPk(r.userId, { attributes: ['id', 'email', 'notificationPreferences'] });
        if (user && user.email) {
          // Respect user's notification preferences
          const prefs = user.notificationPreferences || {};
          const emailPrefKey = getEmailPrefKey(type);
          if (emailPrefKey && prefs[emailPrefKey] === false) continue; // opted out

          const emailHtml = buildEmailHtml({ title, message, type, actionUrl, responsibleUser, responsibleRole });
          await sendEmail({ to: user.email, subject: title, html: emailHtml });
        }
      } catch (err) {
        console.error('[notify] Failed to send email to user', r.userId, err.message);
      }
    }
  }

  return results;
}

/**
 * Build a neutral, clean HTML email body.
 */
function buildEmailHtml({ title, message, type, actionUrl, responsibleUser, responsibleRole }) {
  const now = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const responsibleLine = responsibleUser
    ? `<p style="color: #64748b; font-size: 12px; margin: 12px 0 0;">Action by: <strong>${responsibleUser}</strong>${responsibleRole ? ` (${responsibleRole})` : ''}</p>`
    : '';
  return `
    <div style="font-family: 'Inter', system-ui, sans-serif; max-width: 480px; margin: 0 auto;">
      <div style="background: #2563eb; padding: 24px; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 20px;">${title}</h1>
      </div>
      <div style="padding: 24px; background: #fff; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="color: #1e293b; font-size: 14px; line-height: 1.6; margin: 0 0 12px;">${message}</p>
        ${actionUrl ? `<p style="margin: 16px 0;"><a href="${actionUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 13px;">View Details</a></p>` : ''}
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
        ${responsibleLine}
        <p style="color: #94a3b8; font-size: 11px; margin: ${responsibleLine ? '4px' : '0'} 0 0;">
          Type: ${type.replace(/_/g, ' ').toUpperCase()} &bull; ${now}
        </p>
        <p style="color: #94a3b8; font-size: 11px; margin: 4px 0 0;">This is an automated notification from the HRMS system.</p>
      </div>
    </div>
  `;
}

/**
 * Map notification types to the corresponding email preference key.
 * This lets users opt out of specific email notification categories.
 */
function getEmailPrefKey(notificationType) {
  const mapping = {
    // Leave-related -> leaveApprovalAlerts
    leave_request: 'leaveApprovalAlerts',
    leave_approved: 'leaveApprovalAlerts',
    leave_rejected: 'leaveApprovalAlerts',
    // Task-related -> taskReminders
    task_assigned: 'taskReminders',
    task_updated: 'taskReminders',
    task_completed: 'taskReminders',
    task_commented: 'taskReminders',
    // General -> emailNotifications
    announcement: 'emailNotifications',
    payslip_generated: 'emailNotifications',
    payroll_approved: 'emailNotifications',
    payroll_paid: 'emailNotifications',
    attendance_reminder: 'emailNotifications',
    attendance_correction: 'emailNotifications',
    attendance_approved: 'emailNotifications',
    attendance_rejected: 'emailNotifications',
    review_added: 'emailNotifications',
    review_scheduled: 'emailNotifications',
    employee_created: 'emailNotifications',
    employee_promoted: 'emailNotifications',
    role_changed: 'emailNotifications',
    document_verified: 'emailNotifications',
    candidate_status: 'emailNotifications'
  };
  return mapping[notificationType] || 'emailNotifications';
}

module.exports = { notifyUser, notifyMany, buildEmailHtml };
