const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const LeaveBalance = sequelize.define('LeaveBalance', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  employeeId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  casual: {
    type: DataTypes.DECIMAL(4, 1),
    defaultValue: 12.0
  },
  sick: {
    type: DataTypes.DECIMAL(4, 1),
    defaultValue: 12.0
  },
  earned: {
    type: DataTypes.DECIMAL(4, 1),
    defaultValue: 18.0
  },
  maternity: {
    type: DataTypes.DECIMAL(4, 1),
    defaultValue: 180.0
  },
  paternity: {
    type: DataTypes.DECIMAL(4, 1),
    defaultValue: 15.0
  },
  unpaid: {
    type: DataTypes.DECIMAL(4, 1),
    defaultValue: 0
  },
  totalCasual: {
    type: DataTypes.DECIMAL(4, 1),
    defaultValue: 12.0
  },
  totalSick: {
    type: DataTypes.DECIMAL(4, 1),
    defaultValue: 12.0
  },
  totalEarned: {
    type: DataTypes.DECIMAL(4, 1),
    defaultValue: 18.0
  },
  totalMaternity: {
    type: DataTypes.DECIMAL(4, 1),
    defaultValue: 180.0
  },
  totalPaternity: {
    type: DataTypes.DECIMAL(4, 1),
    defaultValue: 15.0
  }
}, {
  tableName: 'leave_balances',
  indexes: [
    {
      unique: true,
      fields: ['employee_id', 'year']
    }
  ]
});

LeaveBalance.associate = (models) => {
  LeaveBalance.belongsTo(models.Employee, { foreignKey: 'employeeId', as: 'employee' });
};

module.exports = LeaveBalance;
