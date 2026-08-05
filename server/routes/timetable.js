const express = require('express');
const TimetableSlot = require('../models/Timetable');
const TimeSlot = require('../models/TimeSlot');
const Course = require('../models/Course');
const User = require('../models/User');
const Classroom = require('../models/Classroom');
const Program = require('../models/Program');
const AcademicLevel = require('../models/AcademicLevel');
const Semester = require('../models/Semester');
const AcademicYear = require('../models/AcademicYear');
const CourseOffering = require('../models/CourseOffering');
const { generateTimetable } = require('../scheduler/algorithm');
const { auth } = require('../middleware/auth');
const { DAYS } = require('../config');
const PDFDocument = require('pdfkit');
const GenerationHistory = require('../models/GenerationHistory');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const where = {};
    if (req.query.semesterId) where.semesterId = req.query.semesterId;
    if (req.query.programId) where.programId = req.query.programId;
    if (req.query.academicLevelId) where.academicLevelId = req.query.academicLevelId;

    const slots = await TimetableSlot.findAll({
      where,
      include: [
        { model: Course, as: 'Course', attributes: ['id', 'code', 'name', 'creditHours', 'type'] },
        { model: User, as: 'User', attributes: ['id', 'name'] },
        { model: Classroom, as: 'Classroom', attributes: ['id', 'name', 'capacity', 'type'] },
        { model: Program, as: 'Program', attributes: ['id', 'name', 'code'] },
        { model: AcademicLevel, as: 'AcademicLevel', attributes: ['id', 'level', 'name'] },
        { model: Semester, as: 'Semester', attributes: ['id', 'name'] }
      ],
      order: [['day', 'ASC'], ['startTime', 'ASC']]
    });

    // Group by programme + level
    const grouped = {};
    for (const slot of slots) {
      const progName = slot.Program?.name || 'Unassigned';
      const levelNum = slot.AcademicLevel?.level || 0;
      const key = `${progName} - Level ${levelNum}`;
      if (!grouped[key]) {
        grouped[key] = {
          programme: slot.Program,
          level: slot.AcademicLevel,
          slots: [],
          grid: {}
        };
        for (const day of DAYS) grouped[key].grid[day] = {};
      }
      grouped[key].slots.push({
        id: slot.id,
        courseCode: slot.Course?.code,
        courseName: slot.Course?.name,
        creditHours: slot.Course?.creditHours,
        courseType: slot.Course?.type,
        lecturerName: slot.User?.name,
        classroomName: slot.Classroom?.name,
        classroomType: slot.Classroom?.type,
        classroomCapacity: slot.Classroom?.capacity,
        startTime: slot.startTime,
        endTime: slot.endTime,
        day: slot.day
      });
      if (grouped[key].grid[slot.day]) {
        if (!grouped[key].grid[slot.day][slot.startTime]) grouped[key].grid[slot.day][slot.startTime] = [];
        grouped[key].grid[slot.day][slot.startTime].push({
          id: slot.id,
          courseCode: slot.Course?.code,
          courseName: slot.Course?.name,
          creditHours: slot.Course?.creditHours,
          lecturerName: slot.User?.name,
          classroomName: slot.Classroom?.name,
          startTime: slot.startTime,
          endTime: slot.endTime
        });
      }
    }

    res.json({ grouped, total: slots.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/generate', auth, async (req, res) => {
  try {
    const { academicYearId, semesterId, facultyId, departmentId } = req.body;
    const result = await generateTimetable({ academicYearId, semesterId, facultyId, departmentId });

    await GenerationHistory.create({
      semesterId: semesterId || null,
      academicYearId: academicYearId || null,
      placedCount: result.placedCount || 0,
      clashCount: (result.clashes || []).length,
      totalOfferings: result.totalOfferings || 0,
      groups: result.groups || [],
      label: result.label || '',
      status: result.success ? 'success' : 'failed',
      error: result.error || null,
      generatedBy: req.user?.id || null,
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/clear', auth, async (req, res) => {
  try {
    const where = {};
    if (req.query.semesterId) where.semesterId = req.query.semesterId;
    await TimetableSlot.destroy({ where });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/pdf', auth, async (req, res) => {
  try {
    const where = {};
    if (req.query.semesterId) where.semesterId = req.query.semesterId;
    if (req.query.programId) where.programId = req.query.programId;
    if (req.query.academicLevelId) where.academicLevelId = req.query.academicLevelId;

    const slots = await TimetableSlot.findAll({
      where,
      include: [
        { model: Course, as: 'Course', attributes: ['code', 'name', 'type'] },
        { model: User, as: 'User', attributes: ['name'] },
        { model: Classroom, as: 'Classroom', attributes: ['name'] },
        { model: Program, as: 'Program', attributes: ['name'] },
        { model: AcademicLevel, as: 'AcademicLevel', attributes: ['level', 'name'] },
      ],
      order: [['day', 'ASC'], ['startTime', 'ASC']]
    });

    const DAYS_LIST = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const PERIODS = [
      { label: 'P1', start: '08:00', end: '08:55' },
      { label: 'P2', start: '09:00', end: '09:55' },
      { label: 'P3', start: '10:30', end: '11:25' },
      { label: 'P4', start: '11:30', end: '12:25' },
      { label: 'P5', start: '13:00', end: '13:55' },
      { label: 'P6', start: '14:00', end: '14:55' },
      { label: 'P7', start: '15:00', end: '15:55' },
      { label: 'P8', start: '16:00', end: '16:55' },
      { label: 'P9', start: '17:00', end: '17:55' },
      { label: 'P10', start: '18:00', end: '18:55' },
    ];

    const timeToPeriod = {};
    PERIODS.forEach((p, i) => { timeToPeriod[p.start] = i; });

    const grouped = {};
    for (const slot of slots) {
      const progName = slot.Program?.name || 'Unassigned';
      const levelNum = slot.AcademicLevel?.level || 0;
      const key = `${progName} - Level ${levelNum}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(slot);
    }

    const doc = new PDFDocument({ layout: 'landscape', margin: 30 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="timetable.pdf"');
    doc.pipe(res);

    for (const [groupName, groupSlots] of Object.entries(grouped)) {
      const grid = {};
      DAYS_LIST.forEach((d) => { grid[d] = new Array(10).fill(null); });
      for (const s of groupSlots) {
        const idx = timeToPeriod[s.startTime];
        if (idx !== undefined && grid[s.day]) {
          grid[s.day][idx] = s;
        }
      }

      doc.fontSize(16).font('Helvetica-Bold').text(groupName, { align: 'center' });
      doc.moveDown(0.3);

      const colW = 105;
      const periodW = 50;
      const timeW = 65;
      const startX = doc.x;
      const startY = doc.y;
      const rowH = 28;

      doc.fontSize(8).font('Helvetica-Bold');
      let x = startX;
      doc.text('Period', x, startY, { width: periodW, align: 'center' }); x += periodW;
      doc.text('Time', x, startY, { width: timeW, align: 'center' }); x += timeW;
      for (const day of DAYS_LIST) {
        doc.text(day, x, startY, { width: colW, align: 'center' });
        x += colW;
      }

      doc.moveTo(startX, startY + 14).lineTo(x, startY + 14).stroke();
      doc.font('Helvetica').fontSize(7);

      for (let pi = 0; pi < 10; pi++) {
        const y = startY + 14 + pi * rowH;
        const p = PERIODS[pi];
        let cx = startX;

        doc.text(p.label, cx, y + 6, { width: periodW, align: 'center' }); cx += periodW;
        doc.text(`${p.start}-${p.end}`, cx, y + 6, { width: timeW, align: 'center' }); cx += timeW;

        for (const day of DAYS_LIST) {
          const cell = grid[day][pi];
          if (cell) {
            const code = cell.Course?.code || '';
            const room = cell.Classroom?.name || '';
            doc.font('Helvetica-Bold').text(code, cx + 2, y + 2, { width: colW - 4, align: 'center' });
            doc.font('Helvetica').text(room, cx + 2, y + 13, { width: colW - 4, align: 'center' });
          }
          cx += colW;
        }

        doc.moveTo(startX, y + rowH).lineTo(startX + periodW + timeW + 5 * colW, y + rowH).strokeColor('#ccc').stroke();
        doc.strokeColor('#000');
      }

      doc.moveDown(2);
      if (Object.keys(grouped).indexOf(groupName) < Object.keys(grouped).length - 1) {
        doc.addPage();
      }
    }

    doc.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
