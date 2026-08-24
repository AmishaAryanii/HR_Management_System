const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Payslip = sequelize.define('Payslip', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  employeeId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  payrollId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  payslipNumber: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  month: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: 'Effective start date (for partial/custom range payslips)'
  },
  endDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: 'Effective end date (for partial/custom range payslips)'
  },
  workingDays: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Actual working days in the pay period'
  },
  paidDays: {
    type: DataTypes.DECIMAL(6, 2),
    allowNull: true,
    comment: 'Actual paid days after attendance adjustment'
  },
  lopDays: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Loss of pay days'
  },
  basicSalary: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  allowances: {
    type: DataTypes.JSON,
    allowNull: true
  },
  deductions: {
    type: DataTypes.JSON,
    allowNull: true
  },
  grossPay: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  totalDeductions: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  netPay: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  dailyRate: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true
  },
  pdfPath: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('generated', 'sent', 'downloaded'),
    defaultValue: 'generated'
  },
  sentAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'payslips'
});

Payslip.associate = (models) => {
  Payslip.belongsTo(models.Employee, { foreignKey: 'employeeId', as: 'employee' });
  Payslip.belongsTo(models.Payroll, { foreignKey: 'payrollId', as: 'payroll' });
};

module.exports = Payslip;
