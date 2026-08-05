const express = require('express');
const router = express.Router();
const Department = require('../models/Department');
const Faculty = require('../models/Faculty');
const Program = require('../models/Program');
const Course = require('../models/Course');
const { auth } = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const where = {};
    if (req.query.facultyId) where.facultyId = req.query.facultyId;
    const depts = await Department.findAll({
      where,
      include: [
        { model: Faculty, as: 'faculty', attributes: ['id', 'name', 'code'] },
        { model: Program, as: 'programs', attributes: ['id', 'name', 'code'] }
      ],
      order: [['name', 'ASC']]
    });
    res.json(depts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, code, facultyId, headId, description } = req.body;
    const dept = await Department.create({ name, code, facultyId: facultyId || null, headId: headId || null, description: description || '' });
    res.status(201).json(dept);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const dept = await Department.findByPk(req.params.id);
    if (!dept) return res.status(404).json({ error: 'Department not found' });
    await dept.update(req.body);
    const updated = await Department.findByPk(dept.id, {
      include: [{ model: Faculty, as: 'faculty' }]
    });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const dept = await Department.findByPk(req.params.id);
    if (!dept) return res.status(404).json({ error: 'Department not found' });
    const progCount = await Program.count({ where: { departmentId: dept.id } });
    if (progCount > 0) {
      return res.status(400).json({ error: 'Cannot delete department with associated programs' });
    }
    await dept.destroy();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
