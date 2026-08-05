const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Faculty = sequelize.define('Faculty', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false, unique: true },
  code: { type: DataTypes.STRING, allowNull: false, unique: true },
  description: { type: DataTypes.TEXT, defaultValue: '' }
}, { timestamps: true });

module.exports = Faculty;
