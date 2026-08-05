const express = require('express');
const router = express.Router();
const Building = require('../models/Building');
const Floor = require('../models/Floor');
const { auth } = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const where = {};
    if (req.query.status) where.status = req.query.status;
    const buildings = await Building.findAll({
      where,
      include: [{ model: Floor, as: 'buildingFloors', attributes: ['id', 'name', 'status'] }],
      order: [['name', 'ASC']]
    });
    res.json(buildings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, code, address, floors, capacity, status } = req.body;
    const building = await Building.create({
      name, code, address: address || '',
      floors: parseInt(floors) || 0, capacity: parseInt(capacity) || 0,
      status: status || 'Active'
    });
    res.status(201).json(building);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const building = await Building.findByPk(req.params.id);
    if (!building) return res.status(404).json({ error: 'Building not found' });
    const allowedFields = ['name', 'code', 'address', 'floors', 'capacity', 'status'];
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }
    await building.update(updates);
    res.json(building);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const building = await Building.findByPk(req.params.id);
    if (!building) return res.status(404).json({ error: 'Building not found' });
    const floorCount = await Floor.count({ where: { buildingId: building.id } });
    if (floorCount > 0) {
      return res.status(400).json({ error: 'Cannot delete building with associated floors' });
    }
    await building.destroy();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
