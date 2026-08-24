const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Candidate = sequelize.define('Candidate', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  recruitmentId: {
    type: DataTypes.INTEGER,
    allowNull: false
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
    validate: {
      isEmail: true
    }
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  resume: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  coverLetter: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  currentCompany: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  currentPosition: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  experienceYears: {
    type: DataTypes.DECIMAL(4, 1),
    allowNull: true
  },
  highestEducation: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  currentSalary: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true
  },
  expectedSalary: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true
  },
  skills: {
    type: DataTypes.JSON,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('applied', 'screened', 'shortlisted', 'interview_scheduled', 'interviewed', 'selected', 'offered', 'hired', 'rejected', 'withdrawn'),
    defaultValue: 'applied'
  },
  source: {
    type: DataTypes.ENUM('website', 'linkedin', 'referral', 'job_portal', 'walk_in', 'other'),
    defaultValue: 'website'
  },
  rating: {
    type: DataTypes.INTEGER,
    validate: { min: 1, max: 5 },
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  appliedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'candidates'
});

Candidate.associate = (models) => {
  Candidate.belongsTo(models.Recruitment, { foreignKey: 'recruitmentId', as: 'recruitment' });
  Candidate.hasMany(models.Interview, { foreignKey: 'candidateId', as: 'interviews' });
};

module.exports = Candidate;
