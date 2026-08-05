const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const AcademicYear = sequelize.define('AcademicYear', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false, unique: true },
  startDate: { type: DataTypes.DATEONLY, allowNull: true },
  endDate: { type: DataTypes.DATEONLY, allowNull: true },
  isCurrent: { type: DataTypes.BOOLEAN, defaultValue: false }
}, { timestamps: true });

module.exports = AcademicYear;
