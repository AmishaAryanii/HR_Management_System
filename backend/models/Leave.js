const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Leave = sequelize.define('Leave', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  employeeId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  leaveType: {
    type: DataTypes.ENUM('casual', 'sick', 'earned', 'maternity', 'paternity', 'unpaid'),
    allowNull: false
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  endDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  totalDays: {
    type: DataTypes.DECIMAL(4, 1),
    allowNull: false
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved_by_manager', 'approved', 'rejected', 'cancelled'),
    defaultValue: 'pending'
  },
  managerComment: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  adminComment: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  approvedByManager: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  approvedByManagerName: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  approvedByManagerRole: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  approvedByAdmin: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  approvedByAdminName: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  approvedByAdminRole: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  rejectedBy: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  rejectedByName: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  rejectedByRole: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  rejectedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  approvedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  document: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  isPaid: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'leaves'
});

Leave.associate = (models) => {
  Leave.belongsTo(models.Employee, { foreignKey: 'employeeId', as: 'employee' });
  Leave.belongsTo(models.Employee, { foreignKey: 'approvedByManager', as: 'manager' });
  Leave.belongsTo(models.Employee, { foreignKey: 'approvedByAdmin', as: 'admin' });
};

module.exports = Leave;
