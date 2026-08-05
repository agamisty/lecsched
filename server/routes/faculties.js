const express = require('express');
const router = express.Router();
const Faculty = require('../models/Faculty');
const Department = require('../models/Department');
const { auth } = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const faculties = await Faculty.findAll({
      include: [{ model: Department, as: 'departments', attributes: ['id', 'name', 'code'] }],
      order: [['name', 'ASC']]
    });
    res.json(faculties);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const faculty = await Faculty.findByPk(req.params.id, {
      include: [{ model: Department, as: 'departments' }]
    });
    if (!faculty) return res.status(404).json({ error: 'Faculty not found' });
    res.json(faculty);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, code, description } = req.body;
    const faculty = await Faculty.create({ name, code, description: description || '' });
    res.status(201).json(faculty);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const faculty = await Faculty.findByPk(req.params.id);
    if (!faculty) return res.status(404).json({ error: 'Faculty not found' });
    const { name, code, description } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (code !== undefined) updates.code = code;
    if (description !== undefined) updates.description = description;
    await faculty.update(updates);
    res.json(faculty);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const faculty = await Faculty.findByPk(req.params.id);
    if (!faculty) return res.status(404).json({ error: 'Faculty not found' });
    const deptCount = await Department.count({ where: { facultyId: faculty.id } });
    if (deptCount > 0) {
      return res.status(400).json({ error: 'Cannot delete faculty with associated departments' });
    }
    await faculty.destroy();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
