const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Message = sequelize.define('Message', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  userName: { type: DataTypes.STRING, allowNull: false },
  senderRole: { type: DataTypes.STRING, allowNull: false, defaultValue: 'lecturer' },
  text: { type: DataTypes.TEXT, allowNull: false },
  recipientId: { type: DataTypes.INTEGER, allowNull: true },
  recipientName: { type: DataTypes.STRING, allowNull: true },
  isPrivate: { type: DataTypes.BOOLEAN, defaultValue: false },
  room: { type: DataTypes.STRING, defaultValue: 'general' },
  edited: { type: DataTypes.BOOLEAN, defaultValue: false },
  replyToId: { type: DataTypes.INTEGER, allowNull: true },
  replyUserName: { type: DataTypes.STRING, allowNull: true },
  replyText: { type: DataTypes.TEXT, allowNull: true },
  readAt: { type: DataTypes.DATE, allowNull: true }
});

module.exports = Message;
