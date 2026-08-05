const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Building = sequelize.define('Building', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false, unique: true },
  code: { type: DataTypes.STRING, allowNull: false },
  address: { type: DataTypes.STRING, defaultValue: '' },
  floors: { type: DataTypes.INTEGER, defaultValue: 0 },
  capacity: { type: DataTypes.INTEGER, defaultValue: 0 },
  status: { type: DataTypes.STRING, defaultValue: 'Active' }
}, { timestamps: true });

module.exports = Building;
