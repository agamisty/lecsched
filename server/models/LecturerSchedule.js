const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const LecturerSchedule = sequelize.define('LecturerSchedule', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  lecturerId: { type: DataTypes.INTEGER, allowNull: false },
  day: { type: DataTypes.STRING, allowNull: false },
  startTime: { type: DataTypes.STRING, allowNull: false },
  endTime: { type: DataTypes.STRING, allowNull: false }
});

module.exports = LecturerSchedule;
