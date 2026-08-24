const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Payroll = sequelize.define('Payroll', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  employeeId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  month: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  basicSalary: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  hra: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  da: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  ta: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  specialAllowance: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  medicalAllowance: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  phoneAllowance: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  bonus: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  overtimePay: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  grossPay: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  pfDeduction: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  taxDeduction: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  insuranceDeduction: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  loanDeduction: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  otherDeductions: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  totalDeductions: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  netPay: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('draft', 'generated', 'approved', 'paid', 'cancelled'),
    defaultValue: 'draft'
  },
  processedBy: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  processedByName: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  processedByRole: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  processedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  approvedBy: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  approvedByName: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  approvedByRole: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  approvedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  paidBy: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  paidByName: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  paidByRole: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  paidAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  paymentMethod: {
    type: DataTypes.ENUM('bank_transfer', 'cheque', 'cash'),
    defaultValue: 'bank_transfer'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'payrolls',
  indexes: [
    {
      unique: true,
      fields: ['employee_id', 'month', 'year']
    }
  ]
});

Payroll.associate = (models) => {
  Payroll.belongsTo(models.Employee, { foreignKey: 'employeeId', as: 'employee' });
  Payroll.belongsTo(models.Employee, { foreignKey: 'processedBy', as: 'processor' });
  Payroll.belongsTo(models.Employee, { foreignKey: 'approvedBy', as: 'approver' });
  Payroll.belongsTo(models.Employee, { foreignKey: 'paidBy', as: 'payer' });
};

module.exports = Payroll;
