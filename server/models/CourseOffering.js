const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const CourseOffering = sequelize.define('CourseOffering', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  courseId: { type: DataTypes.INTEGER, allowNull: false },
  academicLevelId: { type: DataTypes.INTEGER, allowNull: false },
  semesterId: { type: DataTypes.INTEGER, allowNull: false },
  numStudents: { type: DataTypes.INTEGER, defaultValue: 0 },
  lecturerId: { type: DataTypes.INTEGER, allowNull: true }
}, { timestamps: true });

module.exports = CourseOffering;
