const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PerformanceReview = sequelize.define('PerformanceReview', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  employeeId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  reviewerId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  reviewPeriod: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'e.g., Q1 2024, H1 2024, Annual 2024'
  },
  reviewType: {
    type: DataTypes.ENUM('quarterly', 'half_yearly', 'annual', 'probation', 'project'),
    defaultValue: 'annual'
  },
  goals: {
    type: DataTypes.JSON,
    allowNull: true
  },
  kpis: {
    type: DataTypes.JSON,
    allowNull: true
  },
  achievements: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  areasOfImprovement: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  reviewerRole: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Role of the reviewer at time of review'
  },
  overallRating: {
    type: DataTypes.INTEGER,
    validate: { min: 1, max: 5 },
    allowNull: true
  },
  productivity: {
    type: DataTypes.INTEGER,
    validate: { min: 1, max: 5 },
    allowNull: true
  },
  quality: {
    type: DataTypes.INTEGER,
    validate: { min: 1, max: 5 },
    allowNull: true
  },
  teamwork: {
    type: DataTypes.INTEGER,
    validate: { min: 1, max: 5 },
    allowNull: true
  },
  communication: {
    type: DataTypes.INTEGER,
    validate: { min: 1, max: 5 },
    allowNull: true
  },
  leadership: {
    type: DataTypes.INTEGER,
    validate: { min: 1, max: 5 },
    allowNull: true
  },
  feedback: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  employeeComments: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'acknowledged'),
    defaultValue: 'pending'
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  nextReviewDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  }
}, {
  tableName: 'performance_reviews'
});

PerformanceReview.associate = (models) => {
  PerformanceReview.belongsTo(models.Employee, { foreignKey: 'employeeId', as: 'employee' });
  PerformanceReview.belongsTo(models.Employee, { foreignKey: 'reviewerId', as: 'reviewer' });
};

module.exports = PerformanceReview;
