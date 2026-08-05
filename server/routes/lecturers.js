const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Course = require('../models/Course');
const TimetableSlot = require('../models/Timetable');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  const lecturers = await User.findAll({
    where: { role: 'lecturer' },
    attributes: { exclude: ['password'] }
  });
  const data = lecturers.map(l => ({
    ...l.toJSON(),
    departments: l.departments || (l.department ? [l.department] : [])
  }));
  res.json(data);
});

router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { name, email, password, department, departments } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    const lecturer = await User.create({ name, email, password: hashed, department: department || '', departments: departments || [], role: 'lecturer' });
    res.status(201).json({ id: lecturer.id, name: lecturer.name, email: lecturer.email, department: lecturer.department, departments: lecturer.departments });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  await User.destroy({ where: { id: req.params.id } });
  res.json({ success: true });
});

router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'Lecturer not found' });
    const { name, email, department, departments, position, employmentStatus, office, maxHours, contractEnd, password } = req.body;
    if (name) user.name = name;
    if (email) user.email = email;
    if (department !== undefined) user.department = department;
    if (departments !== undefined) user.departments = departments;
    if (position !== undefined) user.position = position;
    if (employmentStatus !== undefined) user.employmentStatus = employmentStatus;
    if (office !== undefined) user.office = office;
    if (maxHours !== undefined) user.maxHours = maxHours;
    if (contractEnd !== undefined) user.contractEnd = contractEnd;
    if (password) user.password = await bcrypt.hash(password, 10);
    await user.save();
    res.json({ id: user.id, name: user.name, email: user.email, department: user.department, departments: user.departments });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/courses', auth, async (req, res) => {
  const courses = await Course.findAll({
    where: { lecturerId: req.user.id },
    include: [{ model: require('../models/Department'), as: 'department' }]
  });
  res.json(courses);
});

router.put('/profile', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { name, departments } = req.body;
    if (name) user.name = name;
    if (departments) user.departments = departments;
    await user.save();
    res.json({ id: user.id, name: user.name, email: user.email, department: user.department, departments: user.departments });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
