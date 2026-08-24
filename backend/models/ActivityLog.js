const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ActivityLog = sequelize.define('ActivityLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  employeeId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  action: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  resource: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'e.g., employee, leave, attendance, payroll'
  },
  resourceId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  details: {
    type: DataTypes.JSON,
    allowNull: true
  },
  ipAddress: {
    type: DataTypes.STRING(45),
    allowNull: true
  },
  userAgent: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  severity: {
    type: DataTypes.ENUM('info', 'warning', 'error', 'critical'),
    defaultValue: 'info'
  }
}, {
  tableName: 'activity_logs',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['resource', 'resource_id'] },
    { fields: ['created_at'] }
  ]
});

ActivityLog.associate = (models) => {
  ActivityLog.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  ActivityLog.belongsTo(models.Employee, { foreignKey: 'employeeId', as: 'employee' });
};

module.exports = ActivityLog;
