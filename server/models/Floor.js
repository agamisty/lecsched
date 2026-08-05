const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Floor = sequelize.define('Floor', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  buildingId: { type: DataTypes.INTEGER, allowNull: true },
  name: { type: DataTypes.STRING, allowNull: false },
  status: { type: DataTypes.STRING, defaultValue: 'Active' },
  description: { type: DataTypes.TEXT, defaultValue: '' },
  rooms: { type: DataTypes.INTEGER, defaultValue: 0 }
}, { timestamps: true });

module.exports = Floor;
