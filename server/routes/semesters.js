const express = require('express');
const router = express.Router();
const Semester = require('../models/Semester');
const AcademicYear = require('../models/AcademicYear');
const { auth } = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const where = {};
    if (req.query.academicYearId) where.academicYearId = req.query.academicYearId;
    const semesters = await Semester.findAll({
      where,
      include: [{ model: AcademicYear, as: 'academicYear', attributes: ['id', 'name'] }],
      order: [['name', 'ASC']]
    });
    res.json(semesters);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/current', auth, async (req, res) => {
  try {
    const semester = await Semester.findOne({
      where: { isCurrent: true },
      include: [{ model: AcademicYear, as: 'academicYear' }]
    });
    res.json(semester || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, academicYearId, isCurrent } = req.body;
    if (isCurrent) {
      await Semester.update({ isCurrent: false }, { where: {} });
    }
    const semester = await Semester.create({ name, academicYearId, isCurrent: isCurrent || false });
    const created = await Semester.findByPk(semester.id, {
      include: [{ model: AcademicYear, as: 'academicYear' }]
    });
    res.status(201).json(created);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const semester = await Semester.findByPk(req.params.id);
    if (!semester) return res.status(404).json({ error: 'Semester not found' });
    if (req.body.isCurrent) {
      await Semester.update({ isCurrent: false }, { where: {} });
    }
    await semester.update(req.body);
    res.json(semester);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const semester = await Semester.findByPk(req.params.id);
    if (!semester) return res.status(404).json({ error: 'Semester not found' });
    await semester.destroy();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
