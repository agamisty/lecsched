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
    const DAY_LABEL = { Mon: 'Mo', Tue: 'Tu', Wed: 'We', Thu: 'Th', Fri: 'Fr' };
    // display times follow the aSC timetable convention (8:10 and 17:10);
    // each entry's `start` is the display label, `mapTo` is the DB slot start it maps to
    const PERIODS = [
      { start: '8:10', end: '8:55', mapTo: '08:00' },
      { start: '9:00', end: '9:55', mapTo: '09:00' },
      { start: '10:30', end: '11:25', mapTo: '10:30' },
      { start: '11:30', end: '12:25', mapTo: '11:30' },
      { start: '13:00', end: '13:55', mapTo: '13:00' },
      { start: '14:00', end: '14:55', mapTo: '14:00' },
      { start: '15:00', end: '15:55', mapTo: '15:00' },
      { start: '16:00', end: '16:55', mapTo: '16:00' },
      { start: '17:10', end: '17:55', mapTo: '17:00' },
      { start: '18:00', end: '18:55', mapTo: '18:00' },
    ];

    const t2m = (t) => { const [h, m] = String(t).split(':').map(Number); return h * 60 + m; };
    const timeToPeriod = {};
    PERIODS.forEach((p, i) => { timeToPeriod[p.mapTo] = i; });

    const esc = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    const grouped = {};
    for (const slot of slots) {
      const progName = slot.Program?.name || 'Unassigned';
      const levelNum = slot.AcademicLevel?.level || 0;
      const key = `${progName} - Level ${levelNum}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(slot);
    }

    const CSS = `* { box-sizing: border-box; }
:root { font-family: Arial, Helvetica, sans-serif; color: #080808; background: #fff; }
html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { margin: 0; background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
@page { size: A3 landscape; margin: 8mm; }
.page { width: 1125px; margin: 0 auto; padding: 0 0 10px; page-break-after: always; }
.page:last-child { page-break-after: auto; }
h1 { margin: 0 0 17px; text-align: center; font-size: 43px; line-height: 1; font-weight: 400; }
.timetable { display: grid; grid-template-columns: 86px repeat(10, 1fr); grid-template-rows: 68px repeat(5, 124px); border: 2px solid #222; page-break-inside: avoid; }
.corner { border-right: 1px solid #222; border-bottom: 1px solid #222; background: #fff; }
.time-head { position: relative; border-right: 1px solid #222; border-bottom: 1px solid #222; text-align: center; padding-top: 7px; background: #fff; }
.time-head strong { display: block; font-size: 20px; font-weight: 400; }
.time-head span { display: block; margin-top: 7px; font-size: 8px; white-space: nowrap; transform: scaleX(.9); }
.day-row { grid-column: 1 / -1; display: grid; grid-template-columns: 86px 1fr; min-width: 0; }
.day-label { display: flex; align-items: center; justify-content: center; border-right: 1px solid #222; border-bottom: 1px solid #222; font-size: 44px; font-weight: 400; background: #fff; }
.slots { position: relative; display: grid; grid-template-columns: repeat(10, 1fr); min-width: 0; border-bottom: 1px solid #222; background: #fff; }
.slot { border-right: 1px solid #bfbfbf; }
.slot:last-child { border-right: 0; }
.event { position: relative; z-index: 2; grid-row: 1; min-width: 0; margin: 0; padding: 7px 9px 6px; border-right: 1px solid #222; background: #fff; overflow: hidden; }
.room { font-size: 11px; line-height: 1; margin-bottom: 24px; }
.course { font-size: 30px; line-height: 1.05; font-weight: 400; text-align: center; white-space: normal; }
.lecturer { position: absolute; left: 9px; right: 9px; bottom: 7px; font-size: 10px; line-height: 1.05; white-space: nowrap; }
footer { display: flex; justify-content: space-between; font-size: 12px; padding-top: 1px; }
@media print {
  .page { margin: 0 auto; }
}
@media (max-width: 900px) {
  .page { width: 1125px; transform-origin: top left; }
  body { overflow-x: auto; }
}`;

    let html = `<!doctype html><html><head><meta charset="utf-8"><title>Timetable Preview</title><style>${CSS}</style></head><body>`;

    for (const [groupName, groupSlots] of Object.entries(grouped)) {
      const progName = groupName.replace(/\s*-\s*Level\s+.*$/, '');
      const levelM = groupName.match(/Level\s+(\d+)/);
      const levelNum = levelM ? parseInt(levelM[1], 10) : 0;
      const nick = levelNum > 0 && levelNum % 100 === 0 ? String(levelNum / 100) : String(levelNum);
      const title = `${progName}${nick ? '-' + nick : ''}`;

      const byDay = {};
      for (const d of DAYS_LIST) byDay[d] = [];
      for (const s of groupSlots) {
        if (byDay[s.day]) byDay[s.day].push(s);
      }

      html += `<div class="page"><h1>${esc(title)}</h1><section class="timetable"><div class="corner"></div>`;
      PERIODS.forEach((p, i) => {
        html += `<div class="time-head"><strong>${i + 1}</strong><span>${p.start} - ${p.end}</span></div>`;
      });

      for (const d of DAYS_LIST) {
        html += `<div class="day-row"><div class="day-label">${DAY_LABEL[d]}</div><div class="slots">`;
        for (let i = 0; i < PERIODS.length; i++) html += '<div class="slot"></div>';
        for (const s of byDay[d]) {
          const startIdx = timeToPeriod[s.startTime];
          const from = startIdx !== undefined ? startIdx : 0;
          let to = from;
          if (s.endTime) {
            const endM = t2m(s.endTime);
            for (let i = PERIODS.length - 1; i >= 0; i--) {
              if (t2m(PERIODS[i].mapTo) < endM) { to = i; break; }
            }
          }
          const span = Math.max(1, to - from + 1);
          const code = esc(s.Course?.code || s.courseCode || '');
          const room = esc(s.Classroom?.name || '');
          const lec = esc(s.User?.name || s.lecturerName || '');
          html += `<article class="event" style="grid-column:${from + 1}/span ${span}"><div class="room">${room}</div><div class="course">${code}</div><div class="lecturer">${lec}</div></article>`;
        }
        html += '</div></div>';
      }

      html += '</section><footer><span>College Of Science Second Semester academic Timetable</span><span>aSC Timetables</span></footer></div>';
    }

    html += '</body></html>';

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="timetable.html"');
    res.send(html);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
