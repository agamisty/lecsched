const http = require('http');
const app = require('../server/app');
const initSocket = require('../server/socket');
const { bootUp } = require('../server/bootstrap');

const server = http.createServer(app);
initSocket(server, process.env.CLIENT_ORIGIN || '*');

bootUp()
  .then(() => console.log('seed-real: boot complete'))
  .catch((e) => console.error('seed-real: boot error', e));

module.exports = server;