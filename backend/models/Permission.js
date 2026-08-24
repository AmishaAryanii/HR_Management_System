const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Permission = sequelize.define('Permission', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  roleId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  resource: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'e.g., employee, leave, payroll, attendance'
  },
  action: {
    type: DataTypes.ENUM('create', 'read', 'update', 'delete', 'manage'),
    allowNull: false
  },
  conditions: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'JSON conditions for row-level security'
  }
}, {
  tableName: 'permissions',
  indexes: [
    { unique: true, fields: ['role_id', 'resource', 'action'] }
  ]
});

Permission.associate = (models) => {
  Permission.belongsTo(models.Role, { foreignKey: 'roleId', as: 'role' });
};

module.exports = Permission;
