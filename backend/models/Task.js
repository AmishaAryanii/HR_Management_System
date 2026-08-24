const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Task = sequelize.define('Task', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    defaultValue: 'medium'
  },
  status: {
    type: DataTypes.ENUM('assigned', 'in_progress', 'completed', 'verified', 'closed', 'cancelled'),
    defaultValue: 'assigned'
  },
  attachments: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array of { filename, url, uploadedAt }'
  },
  comments: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array of { userId, name, text, createdAt }'
  },
  verifiedBy: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  verifiedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  dueDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  assignedTo: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  assignedBy: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  departmentId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  category: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  progress: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    }
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'tasks'
});

Task.associate = (models) => {
  Task.belongsTo(models.Employee, { foreignKey: 'assignedTo', as: 'assignee' });
  Task.belongsTo(models.Employee, { foreignKey: 'assignedBy', as: 'assigner' });
  Task.belongsTo(models.Department, { foreignKey: 'departmentId', as: 'department' });
  Task.hasMany(models.ActivityLog, { foreignKey: 'referenceId', as: 'activities' });
};

module.exports = Task;
