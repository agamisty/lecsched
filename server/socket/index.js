const { Server } = require('socket.io');
const { setIO } = require('./bus');

function initSocket(httpServer, corsOrigin = '*') {
  const io = new Server(httpServer, {
    cors: { origin: corsOrigin }
  });

  setIO(io);

  io.on('connection', (socket) => {
    socket.on('join-room', (room) => {
      socket.join(room);
    });
  });

  require('../socket/chat')(io);

  return io;
}

module.exports = initSocket;
