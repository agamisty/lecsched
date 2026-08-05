const { Server } = require('socket.io');

function initSocket(httpServer, corsOrigin = '*') {
  const io = new Server(httpServer, {
    cors: { origin: corsOrigin }
  });

  io.on('connection', (socket) => {
    socket.on('join-room', (room) => {
      socket.join(room);
    });
  });

  require('../socket/chat')(io);

  return io;
}

module.exports = initSocket;
