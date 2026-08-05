const express = require('express');
const Course = require('../models/Course');
const User = require('../models/User');
const Department = require('../models/Department');
const Program = require('../models/Program');
const { auth } = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const where = {};
    if (req.query.departmentId) where.departmentId = req.query.departmentId;
    if (req.query.programId) where.programId = req.query.programId;
    const courses = await Course.findAll({
      where,
      include: [
        { model: User, as: 'lecturer', attributes: ['id', 'name', 'email'] },
        { model: Department, as: 'department', attributes: ['id', 'name', 'code'] },
        { model: Program, as: 'program', attributes: ['id', 'name', 'code', 'type'] }
      ],
      order: [['code', 'ASC']]
    });
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { code, name, creditHours, departmentId, programId, type } = req.body;
    const course = await Course.create({
      code, name, creditHours: creditHours || 3,
      departmentId: departmentId || null, programId: programId || null,
      type: type || 'lecture'
    });
    const created = await Course.findByPk(course.id, {
      include: [
        { model: User, as: 'lecturer', attributes: ['id', 'name', 'email'] },
        { model: Department, as: 'department' },
        { model: Program, as: 'program' }
      ]
    });
    res.status(201).json(created);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id);
    if (!course) return res.status(404).json({ error: 'Course not found' });
    const allowedFields = ['code', 'name', 'creditHours', 'departmentId', 'programId', 'type'];
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }
    await course.update(updates);
    const updated = await Course.findByPk(course.id, {
      include: [
        { model: User, as: 'lecturer', attributes: ['id', 'name', 'email'] },
        { model: Department, as: 'department' },
        { model: Program, as: 'program' }
      ]
    });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id);
    if (!course) return res.status(404).json({ error: 'Course not found' });
    await course.destroy();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
