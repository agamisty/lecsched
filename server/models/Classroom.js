const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Classroom = sequelize.define('Classroom', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false, unique: true },
  capacity: { type: DataTypes.INTEGER, allowNull: false },
  building: { type: DataTypes.STRING, defaultValue: '' },
  floor: { type: DataTypes.STRING, defaultValue: '' },
  type: { type: DataTypes.STRING, defaultValue: 'Lecture Hall' },
  status: { type: DataTypes.STRING, defaultValue: 'Available' }
}, { timestamps: true });

module.exports = Classroom;
