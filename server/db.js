require('dotenv').config();

require('pg');

const { Sequelize } = require('sequelize');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error(
    'DATABASE_URL is required (e.g. postgres://USER:PASS@HOST:5432/db from Neon or Supabase). See DEPLOYMENT.md.'
  );
}

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: process.env.DATABASE_SSL === 'false' ? false : { require: true, rejectUnauthorized: false }
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

module.exports = sequelize;
