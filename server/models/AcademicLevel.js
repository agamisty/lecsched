const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const AcademicLevel = sequelize.define('AcademicLevel', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  programId: { type: DataTypes.INTEGER, allowNull: false },
  level: { type: DataTypes.INTEGER, allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false }
}, { timestamps: true });

module.exports = AcademicLevel;
