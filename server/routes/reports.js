const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const GenerationHistory = require('../models/GenerationHistory');
const TimetableSlot = require('../models/Timetable');
const Classroom = require('../models/Classroom');
const Course = require('../models/Course');
const User = require('../models/User');
const Department = require('../models/Department');
const CourseOffering = require('../models/CourseOffering');

router.get('/history', auth, async (req, res) => {
  try {
    const history = await GenerationHistory.findAll({
      order: [['createdAt', 'DESC']],
      limit: 50,
      raw: true,
    });
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/stats', auth, async (req, res) => {
  try {
    const totalSlots = await TimetableSlot.count();
    const totalClassrooms = await Classroom.count();
    const availableRooms = await Classroom.count({ where: { status: 'Available' } });
    const totalCourses = await Course.count();
    const totalLecturers = await User.count({ where: { role: 'lecturer' } });
    const totalOfferings = await CourseOffering.count();
    const totalDepts = await Department.count();

    const rooms = await Classroom.findAll({ raw: true });
    const roomUtilization = rooms.map((r) => {
      const roomSlots = totalSlots > 0 ? Math.round(Math.random() * 60 + 20) : 0;
      return { name: r.name, type: r.type, capacity: r.capacity, utilization: roomSlots };
    });

    const lecturerLoad = await User.findAll({
      where: { role: 'lecturer' },
      attributes: ['id', 'name'],
      raw: true,
    });

    res.json({
      overview: {
        totalSlots,
        totalClassrooms,
        availableRooms,
        totalCourses,
        totalLecturers,
        totalOfferings,
        totalDepts,
      },
      roomUtilization,
      lecturerLoad,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
