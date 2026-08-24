const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Recruitment = sequelize.define('Recruitment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  jobTitle: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  jobCode: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true
  },
  departmentId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  designationId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  employmentType: {
    type: DataTypes.ENUM('full_time', 'part_time', 'contract', 'internship'),
    defaultValue: 'full_time'
  },
  vacancies: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  location: {
    type: DataTypes.STRING(200),
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
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  requirements: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  responsibilities: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  skills: {
    type: DataTypes.JSON,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('draft', 'published', 'closed', 'cancelled'),
    defaultValue: 'draft'
  },
  postedBy: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  postedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  closingDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  isRemote: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'recruitments'
});

Recruitment.associate = (models) => {
  Recruitment.belongsTo(models.Department, { foreignKey: 'departmentId', as: 'department' });
  Recruitment.belongsTo(models.Designation, { foreignKey: 'designationId', as: 'designation' });
  Recruitment.belongsTo(models.Employee, { foreignKey: 'postedBy', as: 'poster' });
  Recruitment.hasMany(models.Candidate, { foreignKey: 'recruitmentId', as: 'candidates' });
};

module.exports = Recruitment;
