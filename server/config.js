require('dotenv').config();

module.exports = {
  JWT_SECRET: process.env.JWT_SECRET || 'lecsched_secret_key_2024',
  JWT_EXPIRES_IN: '7d',
  PORT: process.env.PORT || 5000,
  DAYS: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  TIME_SLOTS: ['08:00', '10:30', '13:00', '15:00', '17:00']
};
