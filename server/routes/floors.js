const express = require('express');
const router = express.Router();
const Floor = require('../models/Floor');
const Building = require('../models/Building');
const { auth } = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const where = {};
    if (req.query.buildingId) where.buildingId = req.query.buildingId;
    const floors = await Floor.findAll({
      where,
      include: [{ model: Building, as: 'building', attributes: ['id', 'name', 'code'] }],
      order: [['name', 'ASC']]
    });
    res.json(floors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { buildingId, name, status, description } = req.body;
    const floor = await Floor.create({
      buildingId: buildingId || null,
      name,
      status: status || 'Active',
      description: description || ''
    });
    res.status(201).json(floor);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const floor = await Floor.findByPk(req.params.id);
    if (!floor) return res.status(404).json({ error: 'Floor not found' });
    const allowedFields = ['buildingId', 'name', 'status', 'description'];
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }
    await floor.update(updates);
    const updated = await Floor.findByPk(floor.id, {
      include: [{ model: Building, as: 'building', attributes: ['id', 'name', 'code'] }]
    });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const floor = await Floor.findByPk(req.params.id);
    if (!floor) return res.status(404).json({ error: 'Floor not found' });
    await floor.destroy();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
