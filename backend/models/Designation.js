const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Designation = sequelize.define('Designation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  code: {
    type: DataTypes.STRING(10),
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  grade: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  minSalary: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true
  },
  maxSalary: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active'
  },
  departmentId: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'designations'
});

Designation.associate = (models) => {
  Designation.hasMany(models.Employee, { foreignKey: 'designationId', as: 'employees' });
  Designation.belongsTo(models.Department, { foreignKey: 'departmentId', as: 'department' });
};

module.exports = Designation;
