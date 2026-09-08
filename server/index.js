const http = require('http');
const app = require('./app');
const initSocket = require('./socket');
const { PORT } = require('./config');
const { bootUp } = require('./bootstrap');

const server = http.createServer(app);
initSocket(server, '*');

async function start() {
  await bootUp();
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

start();