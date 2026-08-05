const http = require('http');
const app = require('../server/app');
const initSocket = require('../server/socket');

const server = http.createServer(app);
initSocket(server, process.env.CLIENT_ORIGIN || '*');

module.exports = server;
