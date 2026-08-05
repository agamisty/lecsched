const express = require('express');
const router = express.Router();
const AcademicLevel = require('../models/AcademicLevel');
const Program = require('../models/Program');
const CourseOffering = require('../models/CourseOffering');
const Course = require('../models/Course');
const Semester = require('../models/Semester');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const where = {};
    if (req.query.programId) where.programId = req.query.programId;
    const levels = await AcademicLevel.findAll({
      where,
      include: [
        { model: Program, as: 'program', attributes: ['id', 'name', 'code'] },
        {
          model: CourseOffering, as: 'offerings',
          include: [
            { model: Course, as: 'course', attributes: ['id', 'code', 'name', 'creditHours', 'type'] },
            { model: Semester, as: 'semester', attributes: ['id', 'name'] },
            { model: User, as: 'lecturer', attributes: ['id', 'name'] }
          ]
        }
      ],
      order: [['level', 'ASC']]
    });
    res.json(levels);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const level = await AcademicLevel.findByPk(req.params.id, {
      include: [
        { model: Program, as: 'program' },
        {
          model: CourseOffering, as: 'offerings',
          include: [
            { model: Course, as: 'course' },
            { model: Semester, as: 'semester' },
            { model: User, as: 'lecturer', attributes: ['id', 'name'] }
          ]
        }
      ]
    });
    if (!level) return res.status(404).json({ error: 'Academic level not found' });
    res.json(level);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { programId, level, name } = req.body;
    const existing = await AcademicLevel.findOne({ where: { programId, level } });
    if (existing) return res.status(400).json({ error: 'This level already exists for this program' });
    const acadLevel = await AcademicLevel.create({ programId, level, name: name || `Level ${level}` });
    res.status(201).json(acadLevel);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const level = await AcademicLevel.findByPk(req.params.id);
    if (!level) return res.status(404).json({ error: 'Academic level not found' });
    await level.update(req.body);
    res.json(level);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const level = await AcademicLevel.findByPk(req.params.id);
    if (!level) return res.status(404).json({ error: 'Academic level not found' });
    const offCount = await CourseOffering.count({ where: { academicLevelId: level.id } });
    if (offCount > 0) {
      return res.status(400).json({ error: 'Cannot delete level with associated course offerings' });
    }
    await level.destroy();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
