const Message = require('../models/Message');

function setupChat(io) {
  const onlineUsers = {};

  function msgPayload(msg) {
    return {
      id: msg.id,
      userId: msg.userId,
      userName: msg.userName,
      text: msg.text,
      recipientId: msg.recipientId,
      recipientName: msg.recipientName,
      isPrivate: msg.isPrivate,
      room: msg.room,
      edited: !!msg.edited,
      replyToId: msg.replyToId,
      replyUserName: msg.replyUserName,
      replyText: msg.replyText,
      createdAt: msg.createdAt,
      updatedAt: msg.updatedAt
    };
  }

  // lets REST routes broadcast edit/delete updates to the message's audience
  io.chatBroadcast = (msg, event, payload) => {
    if (!msg) return;
    if (msg.isPrivate) {
      const ids = [msg.userId, msg.recipientId].filter(Boolean);
      for (const id of ids) {
        const entries = onlineUsers[id];
        if (entries) {
          for (const e of entries) io.to(e.socketId).emit(event, payload);
        }
      }
    } else {
      io.to(msg.room || 'general').emit(event, payload);
    }
  };

  function emitOnline() {
    for (const r of ['general', 'postgraduate']) {
      const ids = Object.entries(onlineUsers)
        .filter(([, entries]) => entries.some(e => e.room === r))
        .map(([id]) => Number(id));
      io.to(r).emit('online-users', [...new Set(ids)]);
    }
  }

  function removeSocket(socketId) {
    for (const userId of Object.keys(onlineUsers)) {
      onlineUsers[userId] = onlineUsers[userId].filter(e => e.socketId !== socketId);
      if (onlineUsers[userId].length === 0) delete onlineUsers[userId];
    }
  }

  io.on('connection', (socket) => {
    socket.on('join', ({ userId, room }) => {
      socket.data.userId = userId;
      const chatRoom = room || 'general';
      socket.data.room = chatRoom;
      socket.join(chatRoom);
      if (!onlineUsers[userId]) onlineUsers[userId] = [];
      onlineUsers[userId].push({ socketId: socket.id, room: chatRoom });
      emitOnline();
    });

    socket.on('switch-room', (room) => {
      const prev = socket.data.room;
      if (prev) socket.leave(prev);
      socket.data.room = room;
      socket.join(room);
      if (socket.data.userId && onlineUsers[socket.data.userId]) {
        const entries = onlineUsers[socket.data.userId];
        for (const e of entries) {
          if (e.socketId === socket.id) e.room = room;
        }
      }
      emitOnline();
    });

    socket.on('send-message', async (data) => {
      try {
        const room = data.room || 'general';
        const msg = await Message.create({
          userId: data.userId,
          userName: data.userName,
          text: data.text,
          isPrivate: false,
          room,
          replyToId: data.replyToId || null,
          replyUserName: data.replyUserName || null,
          replyText: data.replyText || null
        });
        io.to(room).emit('new-message', msgPayload(msg));
      } catch (err) {
        console.error('Chat error:', err);
      }
    });

    socket.on('private-message', async (data) => {
      try {
        const msg = await Message.create({
          userId: data.userId,
          userName: data.userName,
          text: data.text,
          recipientId: data.recipientId,
          recipientName: data.recipientName,
          isPrivate: true,
          room: 'private',
          replyToId: data.replyToId || null,
          replyUserName: data.replyUserName || null,
          replyText: data.replyText || null
        });

        const payload = msgPayload(msg);

        const entries = onlineUsers[data.recipientId];
        if (entries) {
          for (const e of entries) {
            io.to(e.socketId).emit('new-message', payload);
          }
        }
        socket.emit('new-message', payload);
      } catch (err) {
        console.error('Private message error:', err);
      }
    });

    socket.on('disconnect', () => {
      if (socket.data.userId) {
        removeSocket(socket.id);
        emitOnline();
      }
    });
  });
}

module.exports = setupChat;
