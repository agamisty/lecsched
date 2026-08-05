const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const TimeSlot = sequelize.define('TimeSlot', {
  name: { type: DataTypes.STRING, allowNull: false },
  startTime: { type: DataTypes.STRING, allowNull: false },
  endTime: { type: DataTypes.STRING, allowNull: false },
  days: { type: DataTypes.JSON, defaultValue: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
  active: { type: DataTypes.BOOLEAN, defaultValue: true }
}, { timestamps: true });

module.exports = TimeSlot;
