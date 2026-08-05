const express = require('express');
const router = express.Router();
const CourseOffering = require('../models/CourseOffering');
const Course = require('../models/Course');
const AcademicLevel = require('../models/AcademicLevel');
const Semester = require('../models/Semester');
const User = require('../models/User');
const Program = require('../models/Program');
const { auth } = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const where = {};
    if (req.query.semesterId) where.semesterId = req.query.semesterId;
    if (req.query.academicLevelId) where.academicLevelId = req.query.academicLevelId;
    const offerings = await CourseOffering.findAll({
      where,
      include: [
        { model: Course, as: 'course', attributes: ['id', 'code', 'name', 'creditHours', 'type'] },
        { model: AcademicLevel, as: 'academicLevel', include: [{ model: Program, as: 'program', attributes: ['id', 'name', 'code'] }] },
        { model: Semester, as: 'semester', attributes: ['id', 'name'] },
        { model: User, as: 'lecturer', attributes: ['id', 'name'] }
      ],
      order: [['id', 'ASC']]
    });
    res.json(offerings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { courseId, academicLevelId, semesterId, numStudents, lecturerId } = req.body;
    const existing = await CourseOffering.findOne({ where: { courseId, academicLevelId, semesterId } });
    if (existing) return res.status(400).json({ error: 'This course is already offered in this level and semester' });
    const offering = await CourseOffering.create({
      courseId, academicLevelId, semesterId,
      numStudents: numStudents || 0, lecturerId: lecturerId || null
    });
    const created = await CourseOffering.findByPk(offering.id, {
      include: [
        { model: Course, as: 'course' },
        { model: AcademicLevel, as: 'academicLevel', include: [{ model: Program, as: 'program' }] },
        { model: Semester, as: 'semester' },
        { model: User, as: 'lecturer', attributes: ['id', 'name'] }
      ]
    });
    res.status(201).json(created);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const offering = await CourseOffering.findByPk(req.params.id);
    if (!offering) return res.status(404).json({ error: 'Course offering not found' });
    await offering.update(req.body);
    const updated = await CourseOffering.findByPk(offering.id, {
      include: [
        { model: Course, as: 'course' },
        { model: AcademicLevel, as: 'academicLevel', include: [{ model: Program, as: 'program' }] },
        { model: Semester, as: 'semester' },
        { model: User, as: 'lecturer', attributes: ['id', 'name'] }
      ]
    });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const offering = await CourseOffering.findByPk(req.params.id);
    if (!offering) return res.status(404).json({ error: 'Course offering not found' });
    await offering.destroy();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
