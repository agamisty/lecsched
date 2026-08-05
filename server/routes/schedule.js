const express = require('express');
const LecturerSchedule = require('../models/LecturerSchedule');
const { auth } = require('../middleware/auth');
const { DAYS, TIME_SLOTS } = require('../config');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  const schedule = await LecturerSchedule.findAll({
    where: { lecturerId: req.user.id },
    order: [['day', 'ASC'], ['startTime', 'ASC']]
  });
  const grouped = {};
  for (const day of DAYS) {
    grouped[day] = [];
  }
  for (const entry of schedule) {
    if (grouped[entry.day]) {
      grouped[entry.day].push(entry);
    }
  }
  res.json(grouped);
});

router.put('/', auth, async (req, res) => {
  try {
    const { slots } = req.body;
    await LecturerSchedule.destroy({ where: { lecturerId: req.user.id } });

    if (slots && slots.length > 0) {
      const validSlots = slots.filter(s => DAYS.includes(s.day) && TIME_SLOTS.includes(s.startTime));
      for (const slot of validSlots) {
        await LecturerSchedule.create({
          lecturerId: req.user.id,
          day: slot.day,
          startTime: slot.startTime,
          endTime: slot.endTime
        });
      }
    }

    const schedule = await LecturerSchedule.findAll({
      where: { lecturerId: req.user.id },
      order: [['day', 'ASC'], ['startTime', 'ASC']]
    });
    const grouped = {};
    for (const day of DAYS) grouped[day] = [];
    for (const entry of schedule) {
      if (grouped[entry.day]) grouped[entry.day].push(entry);
    }
    res.json(grouped);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  const schedule = await LecturerSchedule.findAll({
    where: { lecturerId: req.params.id },
    order: [['day', 'ASC'], ['startTime', 'ASC']]
  });
  const grouped = {};
  for (const day of DAYS) grouped[day] = [];
  for (const entry of schedule) {
    if (grouped[entry.day]) grouped[entry.day].push(entry);
  }
  res.json(grouped);
});

module.exports = router;
