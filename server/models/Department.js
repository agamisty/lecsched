const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Department = sequelize.define('Department', {
  name: { type: DataTypes.STRING, allowNull: false, unique: true },
  code: { type: DataTypes.STRING, allowNull: false, unique: true },
  facultyId: { type: DataTypes.INTEGER, allowNull: true },
  headId: { type: DataTypes.INTEGER, allowNull: true },
  description: { type: DataTypes.TEXT, defaultValue: '' }
}, { timestamps: true });

module.exports = Department;
