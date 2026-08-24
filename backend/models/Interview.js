const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Interview = sequelize.define('Interview', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  candidateId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  interviewerId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  round: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  type: {
    type: DataTypes.ENUM('phone', 'video', 'in_person', 'technical', 'hr', 'manager'),
    defaultValue: 'video'
  },
  scheduledDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  duration: {
    type: DataTypes.INTEGER,
    defaultValue: 60,
    comment: 'Duration in minutes'
  },
  location: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  meetingLink: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'rescheduled'),
    defaultValue: 'scheduled'
  },
  feedback: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  rating: {
    type: DataTypes.INTEGER,
    validate: { min: 1, max: 5 },
    allowNull: true
  },
  result: {
    type: DataTypes.ENUM('pass', 'fail', 'hold'),
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'interviews'
});

Interview.associate = (models) => {
  Interview.belongsTo(models.Candidate, { foreignKey: 'candidateId', as: 'candidate' });
  Interview.belongsTo(models.Employee, { foreignKey: 'interviewerId', as: 'interviewer' });
};

module.exports = Interview;
