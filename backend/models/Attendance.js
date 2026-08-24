const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Attendance = sequelize.define('Attendance', {
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
  checkIn: {
    type: DataTypes.DATE,
    allowNull: true
  },
  checkOut: {
    type: DataTypes.DATE,
    allowNull: true
  },
  breakIn: {
    type: DataTypes.DATE,
    allowNull: true
  },
  breakOut: {
    type: DataTypes.DATE,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('present', 'absent', 'late', 'half_day', 'on_leave', 'holiday', 'weekend'),
    defaultValue: 'present'
  },
  isLate: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  lateMinutes: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  overtimeMinutes: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  totalHours: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00
  },
  breakHours: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00
  },
  workingHours: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  markedBy: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  markedByName: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  statusUpdatedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'User who last updated the attendance status'
  },
  statusUpdatedByName: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  statusUpdatedByRole: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  statusUpdatedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  ipAddress: {
    type: DataTypes.STRING(45),
    allowNull: true
  },
  location: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
}, {
  tableName: 'attendances',
  indexes: [
    {
      unique: true,
      fields: ['employee_id', 'date']
    }
  ]
});

Attendance.associate = (models) => {
  Attendance.belongsTo(models.Employee, { foreignKey: 'employeeId', as: 'employee' });
};

module.exports = Attendance;
