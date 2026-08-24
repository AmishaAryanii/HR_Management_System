const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Employee = sequelize.define('Employee', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  employeeId: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true
  },
  firstName: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  lastName: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  gender: {
    type: DataTypes.ENUM('male', 'female', 'other'),
    allowNull: true
  },
  dateOfBirth: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  joiningDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  employmentStatus: {
    type: DataTypes.ENUM('active', 'inactive', 'suspended', 'terminated', 'resigned'),
    defaultValue: 'active'
  },
  employmentType: {
    type: DataTypes.ENUM('full_time', 'part_time', 'contract', 'intern', 'probation'),
    defaultValue: 'full_time'
  },
  salary: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'USD'
  },
  bankName: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  bankAccountNo: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  ifscCode: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  panNumber: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  emergencyContactName: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  emergencyContactPhone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  emergencyContactRelation: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  profilePhoto: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  departmentId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  designationId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  reportingManagerId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true
  }
}, {
  tableName: 'employees'
});

Employee.associate = (models) => {
  Employee.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  Employee.belongsTo(models.Department, { foreignKey: 'departmentId', as: 'department' });
  Employee.belongsTo(models.Designation, { foreignKey: 'designationId', as: 'designation' });
  Employee.belongsTo(models.Employee, { foreignKey: 'reportingManagerId', as: 'manager' });
  Employee.hasMany(models.Employee, { foreignKey: 'reportingManagerId', as: 'subordinates' });
  Employee.hasMany(models.Attendance, { foreignKey: 'employeeId', as: 'attendances' });
  Employee.hasMany(models.Leave, { foreignKey: 'employeeId', as: 'leaves' });
  Employee.hasMany(models.LeaveBalance, { foreignKey: 'employeeId', as: 'leaveBalances' });
  Employee.hasMany(models.Payslip, { foreignKey: 'employeeId', as: 'payslips' });
  Employee.hasMany(models.Task, { foreignKey: 'assignedTo', as: 'tasks' });
  Employee.hasMany(models.Task, { foreignKey: 'assignedBy', as: 'assignedTasks' });
  Employee.hasMany(models.Document, { foreignKey: 'employeeId', as: 'documents' });
  Employee.hasMany(models.PerformanceReview, { foreignKey: 'employeeId', as: 'reviews' });
  Employee.hasMany(models.Notification, { foreignKey: 'employeeId', as: 'notifications' });
  Employee.hasMany(models.Timesheet, { foreignKey: 'employeeId', as: 'timesheets' });
};

module.exports = Employee;
