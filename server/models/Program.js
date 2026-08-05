const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Program = sequelize.define('Program', {
  name: { type: DataTypes.STRING, allowNull: false },
  code: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.STRING, defaultValue: 'BSc' },
  departmentId: { type: DataTypes.INTEGER, allowNull: false },
  duration: { type: DataTypes.INTEGER, defaultValue: 4 },
  description: { type: DataTypes.TEXT, defaultValue: '' }
}, { timestamps: true });

module.exports = Program;
