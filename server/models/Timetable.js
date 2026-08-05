const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const TimetableSlot = sequelize.define('TimetableSlot', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  courseOfferingId: { type: DataTypes.INTEGER, allowNull: false },
  courseId: { type: DataTypes.INTEGER, allowNull: false },
  lecturerId: { type: DataTypes.INTEGER, allowNull: false },
  classroomId: { type: DataTypes.INTEGER, allowNull: false },
  academicYearId: { type: DataTypes.INTEGER, allowNull: true },
  semesterId: { type: DataTypes.INTEGER, allowNull: true },
  programId: { type: DataTypes.INTEGER, allowNull: true },
  academicLevelId: { type: DataTypes.INTEGER, allowNull: true },
  day: { type: DataTypes.STRING, allowNull: false },
  startTime: { type: DataTypes.STRING, allowNull: false },
  endTime: { type: DataTypes.STRING, allowNull: false },
  timetableLabel: { type: DataTypes.STRING, defaultValue: 'Main' }
}, { timestamps: true });

module.exports = TimetableSlot;
