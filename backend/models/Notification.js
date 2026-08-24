const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  employeeId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  type: {
    type: DataTypes.ENUM(
      'leave_request', 'leave_approved', 'leave_rejected',
      'task_assigned', 'task_updated', 'task_completed',
      'announcement',
      'payroll_updated', 'payslip_generated', 'payroll_approved', 'payroll_paid',
      'attendance_reminder', 'attendance_correction', 'attendance_approved', 'attendance_rejected',
      'review_scheduled', 'review_added',
      'document_verified', 'candidate_status',
      'role_changed', 'employee_created', 'employee_promoted',
      'timesheet', 'timesheet_approved', 'timesheet_rejected',
      'general'
    ),
    allowNull: false
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  data: {
    type: DataTypes.JSON,
    allowNull: true
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  readAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isPinned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  actionUrl: {
    type: DataTypes.STRING(500),
    allowNull: true
  }
}, {
  tableName: 'notifications',
  indexes: [
    { fields: ['user_id', 'is_read'] },
    { fields: ['created_at'] }
  ]
});

Notification.associate = (models) => {
  Notification.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  Notification.belongsTo(models.Employee, { foreignKey: 'employeeId', as: 'employee' });
};

module.exports = Notification;
