const express = require('express');
const router = express.Router();
const Classroom = require('../models/Classroom');
const { auth } = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const where = {};
    if (req.query.type) where.type = req.query.type;
    if (req.query.building) where.building = req.query.building;
    const classrooms = await Classroom.findAll({ where, order: [['name', 'ASC']] });
    res.json(classrooms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, capacity, building, floor, type, status } = req.body;
    const room = await Classroom.create({
      name, capacity, building: building || '', floor: floor || '',
      type: type || 'Lecture Hall', status: status || 'Available'
    });
    res.status(201).json(room);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const room = await Classroom.findByPk(req.params.id);
    if (!room) return res.status(404).json({ error: 'Classroom not found' });
    await room.update(req.body);
    res.json(room);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await Classroom.destroy({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
