const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Company = sequelize.define('Company', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  companyName: {
    type: DataTypes.STRING(200),
    allowNull: false,
    defaultValue: 'Debox Technology'
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  phone: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  website: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  logo: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  taxId: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  defaultCurrency: {
    type: DataTypes.STRING(10),
    defaultValue: 'USD'
  },
  dateFormat: {
    type: DataTypes.STRING(20),
    defaultValue: 'MM/DD/YYYY'
  },
  timezone: {
    type: DataTypes.STRING(50),
    defaultValue: 'UTC'
  }
}, {
  tableName: 'companies',
  timestamps: true
});

module.exports = Company;
