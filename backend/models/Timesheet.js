const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Timesheet = sequelize.define('Timesheet', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  employeeId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  project: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  task: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  hours: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending'
  },
  reviewedBy: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  reviewComment: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  reviewedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'timesheets'
});

Timesheet.associate = (models) => {
  Timesheet.belongsTo(models.Employee, { foreignKey: 'employeeId', as: 'employee' });
  Timesheet.belongsTo(models.Employee, { foreignKey: 'reviewedBy', as: 'reviewer' });
};

module.exports = Timesheet;
