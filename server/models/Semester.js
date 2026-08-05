const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Semester = sequelize.define('Semester', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  academicYearId: { type: DataTypes.INTEGER, allowNull: false },
  isCurrent: { type: DataTypes.BOOLEAN, defaultValue: false }
}, { timestamps: true });

module.exports = Semester;
