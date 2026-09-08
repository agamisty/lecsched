const http = require('http');
const app = require('./app');
const initSocket = require('./socket');
const sequelize = require('./db');
const { PORT } = require('./config');
const { ensureDefaultTimeSlots } = require('./scheduler/ensureSlots');

const server = http.createServer(app);
initSocket(server, '*');

async function start() {
  await sequelize.sync({ alter: true });
  await ensureDefaultTimeSlots();
  if (process.env.SEED_REAL === '1') {
    const seedReal = require('./seed-real');
    await seedReal.run();
  }
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

start();
