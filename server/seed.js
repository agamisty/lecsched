const sequelize = require('./db');
const bcrypt = require('bcryptjs');
require('./models/associations');
const User = require('./models/User');
const { ensureDefaultTimeSlots } = require('./scheduler/ensureSlots');

(async () => {
  await sequelize.sync();
  console.log('Tables synced');

  await ensureDefaultTimeSlots();
  console.log('Default time slots ensured');

  const existing = await User.findOne({ where: { email: 'admin@lec.com' } });
  if (!existing) {
    await User.create({
      name: 'Admin User',
      email: 'admin@lec.com',
      password: await bcrypt.hash('pass123', 10),
      role: 'admin',
      department: '',
      departments: []
    });
    console.log('Admin user created: admin@lec.com / pass123');
  } else {
    console.log('Admin user already exists');
  }

  console.log('Seed complete!');
  await sequelize.close();
})();
