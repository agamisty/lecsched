const express = require('express');
const router = express.Router();
const TimeSlot = require('../models/TimeSlot');
const { auth } = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const slots = await TimeSlot.findAll({ order: [['startTime', 'ASC']] });
    res.json(slots);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, startTime, endTime, days, active } = req.body;
    const slot = await TimeSlot.create({
      name, startTime, endTime,
      days: days || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      active: active !== undefined ? active : true
    });
    res.status(201).json(slot);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const slot = await TimeSlot.findByPk(req.params.id);
    if (!slot) return res.status(404).json({ error: 'Time slot not found' });
    await slot.update(req.body);
    res.json(slot);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const slot = await TimeSlot.findByPk(req.params.id);
    if (!slot) return res.status(404).json({ error: 'Time slot not found' });
    await slot.destroy();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
