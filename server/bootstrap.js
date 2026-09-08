const sequelize = require('./db');
const { ensureDefaultTimeSlots } = require('./scheduler/ensureSlots');

async function ensureDefaultAdmin() {
  const User = require('./models/User');
  const bcrypt = require('bcryptjs');
  const existing = await User.findOne({ where: { email: 'admin@lecsched.app' } });
  if (existing) return;
  await User.create({
    name: 'System Administrator',
    email: 'admin@lecsched.app',
    password: await bcrypt.hash('pass123', 10),
    role: 'admin',
    department: '',
    departments: []
  });
  console.log('Admin user created: admin@lecsched.app / pass123');
}

async function cleanupLegacyAdmin() {
  const User = require('./models/User');
  const legacy = await User.findAll({ where: { email: 'admin@lec.com', role: 'admin' } });
  for (const u of legacy) {
    if (u.email === 'admin@lecsched.app') continue;
    await u.destroy();
    console.log(`Legacy admin removed: ${u.name} <${u.email}>`);
  }
}

async function bootUp() {
  try {
    await sequelize.sync({ alter: true });
  } catch (e) {
    // Live schema may have drifted (e.g. missing columns on existing tables).
    // Don't crash the whole boot — seed/repair step adds missing columns.
    console.error('sync(alter) failed, continuing:', e.message);
  }
  await ensureDefaultTimeSlots();
  await ensureDefaultAdmin();
  await cleanupLegacyAdmin();
  if (process.env.SEED_REAL === '1') {
    console.log('seed-real: SEED_REAL=1 detected, running seed');
    const seedReal = require('./seed-real');
    await seedReal.run();
  }
}

let _boot = null;
function getBooted() {
  if (!_boot) {
    _boot = bootUp().catch((e) => {
      _boot = null;
      throw e;
    });
  }
  return _boot;
}

module.exports = { bootUp, getBooted };