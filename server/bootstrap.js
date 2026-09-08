const sequelize = require('./db');
const { ensureDefaultTimeSlots } = require('./scheduler/ensureSlots');

async function bootUp() {
  await sequelize.sync({ alter: true });
  await ensureDefaultTimeSlots();
  if (process.env.SEED_REAL === '1') {
    console.log('seed-real: SEED_REAL=1 detected, running seed');
    const seedReal = require('./seed-real');
    await seedReal.run();
  } else {
    console.log('seed-real: SEED_REAL not set (' + process.env.SEED_REAL + ')');
  }
}

module.exports = { bootUp };