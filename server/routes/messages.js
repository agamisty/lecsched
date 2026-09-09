const express = require('express');
const { Op } = require('sequelize');
const Message = require('../models/Message');
const { auth } = require('../middleware/auth');
const { getIO } = require('../socket/bus');

const router = express.Router();

router.post('/', auth, async (req, res) => {
  try {
    const { text, recipientId, recipientName, room, replyToId, replyUserName, replyText } = req.body || {};
    if (!text || !String(text).trim()) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }
    const privateMsg = !!recipientId;
    const msg = await Message.create({
      userId: req.user.id,
      userName: req.user.name || 'Unknown',
      senderRole: req.user.role || 'lecturer',
      text: String(text).trim(),
      recipientId: recipientId || null,
      recipientName: recipientName || null,
      isPrivate: privateMsg,
      room: privateMsg ? 'private' : (room || 'general'),
      replyToId: replyToId || null,
      replyUserName: replyUserName || null,
      replyText: replyText || null
    });
    const io = getIO();
    if (io && io.emitNewMessage) io.emitNewMessage(msg);
    res.status(201).json(msg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/unread', auth, async (req, res) => {
  try {
    const unread = await Message.findAll({
      where: { isPrivate: true, recipientId: req.user.id, readAt: null },
      order: [['createdAt', 'ASC']]
    });
    const senders = new Map();
    for (const m of unread) {
      const cur = senders.get(m.userId) || { userId: m.userId, userName: m.userName, count: 0 };
      cur.count += 1;
      senders.set(m.userId, cur);
    }
    const list = [...senders.values()];
    res.json({ senders: list, distinctSenders: list.length, totalUnread: unread.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/read', auth, async (req, res) => {
  try {
    const { with: otherId } = req.body || {};
    if (!otherId) return res.status(400).json({ error: 'with is required' });
    await Message.update(
      { readAt: new Date() },
      {
        where: {
          isPrivate: true,
          recipientId: req.user.id,
          userId: parseInt(otherId),
          readAt: null
        }
      }
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/conversations', auth, async (req, res) => {
  const msgs = await Message.findAll({
    where: {
      isPrivate: true,
      [Op.or]: [{ userId: req.user.id }, { recipientId: req.user.id }]
    },
    order: [['createdAt', 'ASC']]
  });
  const map = new Map();
  for (const m of msgs) {
    const otherId = m.userId === req.user.id ? m.recipientId : m.userId;
    if (!otherId) continue;
    const otherName = m.userId === req.user.id ? m.recipientName : m.userName;
    const prev = map.get(otherId);
    if (!prev || new Date(m.createdAt) > new Date(prev.lastAt)) {
      map.set(otherId, {
        otherId,
        otherName: otherName || 'Unknown',
        lastFromMe: m.userId === req.user.id,
        lastText: m.text,
        lastAt: m.createdAt
      });
    }
  }
  const convos = [...map.values()].sort((a, b) => new Date(b.lastAt) - new Date(a.lastAt));
  res.json(convos);
});

router.get('/', auth, async (req, res) => {
  const { type, with: otherId, room } = req.query;
  let where = {};

  if (type === 'private' && otherId) {
    const ids = [req.user.id, parseInt(otherId)];
    where = {
      isPrivate: true,
      [Op.or]: [
        { userId: req.user.id, recipientId: otherId },
        { userId: otherId, recipientId: req.user.id }
      ]
    };
  } else if (room) {
    where = { isPrivate: false, room };
  } else if (type === 'public') {
    where = { isPrivate: false, room: 'general' };
  }

  const messages = await Message.findAll({
    where,
    order: [['createdAt', 'ASC']],
    limit: 100
  });
  res.json(messages);
});

router.put('/:id', auth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const message = await Message.findByPk(id);
    if (!message) return res.status(404).json({ error: 'Message not found' });
    if (message.userId !== req.user.id) {
      return res.status(403).json({ error: 'You can only edit your own messages' });
    }
    if (!req.body.text || !String(req.body.text).trim()) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }
    await message.update({ text: String(req.body.text).trim(), edited: true });
    const io = getIO();
    if (io && io.chatBroadcast) io.chatBroadcast(message, 'message-updated', message);
    res.json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const message = await Message.findByPk(id);
    if (!message) return res.status(404).json({ error: 'Message not found' });
    if (message.userId !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own messages' });
    }
    const io = getIO();
    if (io && io.chatBroadcast) io.chatBroadcast(message, 'message-deleted', { id: message.id });
    await message.destroy();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
