const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const Course = require('../models/Course');
const Classroom = require('../models/Classroom');
const TimetableSlot = require('../models/Timetable');
const Department = require('../models/Department');
const Faculty = require('../models/Faculty');
const Program = require('../models/Program');
const AcademicYear = require('../models/AcademicYear');
const Semester = require('../models/Semester');
const CourseOffering = require('../models/CourseOffering');
const GenerationHistory = require('../models/GenerationHistory');

router.get('/', auth, async (req, res) => {
  try {
    const totalLecturers = await User.count({ where: { role: 'lecturer' } });
    const totalCourses = await Course.count();
    const totalClassrooms = await Classroom.count();
    const totalSlots = await TimetableSlot.count();
    const totalDepartments = await Department.count();
    const totalFaculties = await Faculty.count();
    const totalPrograms = await Program.count();
    const totalOfferings = await CourseOffering.count();

    const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const todayIdx = new Date().getDay();
    const todayName = todayIdx >= 1 && todayIdx <= 5 ? DAY_NAMES[todayIdx - 1] : null;
    const todaySlots = todayName ? await TimetableSlot.count({ where: { day: todayName } }) : 0;

    const currentYear = await AcademicYear.findOne({ where: { isCurrent: true } });
    const currentSemester = await Semester.findOne({ where: { isCurrent: true } });

    const recentHistory = await GenerationHistory.findAll({
      order: [['createdAt', 'DESC']],
      limit: 20,
      raw: true,
    });

    const generationStats = recentHistory.map((h) => ({
      id: h.id,
      label: h.label,
      placedCount: h.placedCount,
      clashCount: h.clashCount,
      totalOfferings: h.totalOfferings,
      status: h.status,
      date: h.createdAt,
    }));

    const deptCounts = await Department.findAll({
      attributes: ['id', 'name', [
        require('sequelize').literal(`(
          SELECT COUNT(*) FROM "TimetableSlots"
          WHERE "TimetableSlots"."programId" IN (SELECT "id" FROM "Programs" WHERE "departmentId" = "Department"."id")
        )`), 'slotCount'
      ]],
      raw: true,
    });

    const distributionData = deptCounts
      .filter((d) => d.slotCount > 0)
      .map((d, i) => ({
        dept: d.name,
        value: d.slotCount,
        color: ['#4facfe', '#ff922b', '#51cf66', '#cc5de8', '#e64980'][i % 5],
      }));

    const successRateData = recentHistory.length > 0
      ? recentHistory.slice(0, 7).reverse().map((h, i) => ({
          day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i] || `D${i}`,
          rate: h.totalOfferings > 0 ? Math.round((h.placedCount / h.totalOfferings) * 100) : 0,
        }))
      : [];

    const activityItems = recentHistory.slice(0, 5).map((h) => ({
      text: h.status === 'success'
        ? `Timetable generated: ${h.placedCount} classes placed`
        : `Timetable generation failed: ${h.error || 'Unknown error'}`,
      detail: h.label || 'No label',
      time: new Date(h.createdAt).toLocaleString(),
      status: h.status,
    }));

    res.json({
      lecturers: totalLecturers,
      courses: totalCourses,
      classrooms: totalClassrooms,
      slots: totalSlots,
      todaySlots,
      departments: totalDepartments,
      faculties: totalFaculties,
      programs: totalPrograms,
      offerings: totalOfferings,
      currentYear: currentYear ? currentYear.name : null,
      currentSemester: currentSemester ? currentSemester.name : null,
      generationStats,
      distributionData,
      successRateData,
      activityData: activityItems,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/history', auth, async (req, res) => {
  try {
    await GenerationHistory.destroy({ where: {} });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
