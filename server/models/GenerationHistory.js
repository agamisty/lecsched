const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const GenerationHistory = sequelize.define('GenerationHistory', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  semesterId: { type: DataTypes.INTEGER, allowNull: true },
  academicYearId: { type: DataTypes.INTEGER, allowNull: true },
  placedCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  clashCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  totalOfferings: { type: DataTypes.INTEGER, defaultValue: 0 },
  groups: { type: DataTypes.JSON, defaultValue: [] },
  label: { type: DataTypes.STRING, defaultValue: '' },
  status: { type: DataTypes.STRING, defaultValue: 'success' },
  error: { type: DataTypes.TEXT, allowNull: true },
  generatedBy: { type: DataTypes.INTEGER, allowNull: true },
}, { timestamps: true });

module.exports = GenerationHistory;
