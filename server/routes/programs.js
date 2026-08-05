const express = require('express');
const router = express.Router();
const Program = require('../models/Program');
const Department = require('../models/Department');
const AcademicLevel = require('../models/AcademicLevel');
const { auth } = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const where = {};
    if (req.query.departmentId) where.departmentId = req.query.departmentId;
    const programs = await Program.findAll({
      where,
      include: [
        { model: Department, as: 'department', attributes: ['id', 'name', 'code'] },
        { model: AcademicLevel, as: 'levels', attributes: ['id', 'level', 'name'] }
      ],
      order: [['name', 'ASC']]
    });
    res.json(programs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, code, type, departmentId, duration, description } = req.body;
    const program = await Program.create({
      name, code, type: type || 'BSc', departmentId, duration: duration || 4, description: description || ''
    });
    res.status(201).json(program);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const program = await Program.findByPk(req.params.id);
    if (!program) return res.status(404).json({ error: 'Program not found' });
    await program.update(req.body);
    res.json(program);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const program = await Program.findByPk(req.params.id);
    if (!program) return res.status(404).json({ error: 'Program not found' });
    const levelCount = await AcademicLevel.count({ where: { programId: program.id } });
    if (levelCount > 0) {
      return res.status(400).json({ error: 'Cannot delete program with associated academic levels' });
    }
    await program.destroy();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
