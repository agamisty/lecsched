const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Course = sequelize.define('Course', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  code: { type: DataTypes.STRING, allowNull: false, unique: true },
  name: { type: DataTypes.STRING, allowNull: false },
  creditHours: { type: DataTypes.INTEGER, defaultValue: 3 },
  departmentId: { type: DataTypes.INTEGER, allowNull: true },
  programId: { type: DataTypes.INTEGER, allowNull: true },
  type: { type: DataTypes.STRING, defaultValue: 'lecture' }
}, { timestamps: true });

module.exports = Course;
