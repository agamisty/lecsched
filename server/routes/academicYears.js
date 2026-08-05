const express = require('express');
const router = express.Router();
const AcademicYear = require('../models/AcademicYear');
const Semester = require('../models/Semester');
const { auth } = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const years = await AcademicYear.findAll({
      include: [{ model: Semester, as: 'semesters', attributes: ['id', 'name', 'isCurrent'] }],
      order: [['name', 'DESC']]
    });
    res.json(years);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/current', auth, async (req, res) => {
  try {
    const year = await AcademicYear.findOne({
      where: { isCurrent: true },
      include: [{ model: Semester, as: 'semesters' }]
    });
    res.json(year || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, startDate, endDate, isCurrent } = req.body;
    if (isCurrent) {
      await AcademicYear.update({ isCurrent: false }, { where: {} });
    }
    const year = await AcademicYear.create({ name, startDate, endDate, isCurrent: isCurrent || false });
    res.status(201).json(year);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const year = await AcademicYear.findByPk(req.params.id);
    if (!year) return res.status(404).json({ error: 'Academic year not found' });
    if (req.body.isCurrent) {
      await AcademicYear.update({ isCurrent: false }, { where: {} });
    }
    await year.update(req.body);
    res.json(year);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const year = await AcademicYear.findByPk(req.params.id);
    if (!year) return res.status(404).json({ error: 'Academic year not found' });
    const semCount = await Semester.count({ where: { academicYearId: year.id } });
    if (semCount > 0) {
      return res.status(400).json({ error: 'Cannot delete year with associated semesters' });
    }
    await year.destroy();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
