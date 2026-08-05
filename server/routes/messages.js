const express = require('express');
const { Op } = require('sequelize');
const Message = require('../models/Message');
const { auth } = require('../middleware/auth');

const router = express.Router();

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

module.exports = router;
