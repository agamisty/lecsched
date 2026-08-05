const Course = require('../models/Course');
const Classroom = require('../models/Classroom');
const User = require('../models/User');
const TimetableSlot = require('../models/Timetable');
const TimeSlot = require('../models/TimeSlot');
const CourseOffering = require('../models/CourseOffering');
const AcademicLevel = require('../models/AcademicLevel');
const Program = require('../models/Program');
const Semester = require('../models/Semester');
const AcademicYear = require('../models/AcademicYear');
const { DAYS } = require('../config');

const DAY_MAP = { Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday' };
const REV_DAY_MAP = Object.fromEntries(Object.entries(DAY_MAP).map(([k, v]) => [v, k]));

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function generateTimetable(config = {}) {
  const { academicYearId, semesterId, facultyId, departmentId } = config;

  if (!semesterId) {
    return { success: false, error: 'Semester is required' };
  }

  // Find semester and year
  const semester = await Semester.findByPk(semesterId, { include: [{ model: AcademicYear, as: 'academicYear' }] });
  if (!semester) return { success: false, error: 'Semester not found' };

  const label = `${semester.academicYear?.name || ''} - ${semester.name}`;

  // Clear previous timetable for this semester
  await TimetableSlot.destroy({ where: { semesterId: semester.id } });

  // Get course offerings for this semester, filtered by faculty/department if provided
  const offeringWhere = { semesterId: semester.id };
  const offerings = await CourseOffering.findAll({
    where: offeringWhere,
    include: [
      { model: Course, as: 'course' },
      { model: User, as: 'lecturer' },
      {
        model: AcademicLevel, as: 'academicLevel',
        include: [{ model: Program, as: 'program', include: [{ model: require('../models/Department'), as: 'department' }] }]
      }
    ]
  });

  // Filter by faculty or department if specified
  let filteredOfferings = offerings;
  if (departmentId) {
    filteredOfferings = offerings.filter(o => o.academicLevel?.program?.departmentId === Number(departmentId));
  } else if (facultyId) {
    const deptIds = (await require('../models/Department').findAll({ where: { facultyId: facultyId } })).map(d => d.id);
    filteredOfferings = offerings.filter(o => deptIds.includes(o.academicLevel?.program?.departmentId));
  }

  if (filteredOfferings.length === 0) {
    return { success: false, error: 'No course offerings found for the selected criteria' };
  }

  // Group offerings by programme + level
  const groups = {};
  for (const offering of filteredOfferings) {
    const prog = offering.academicLevel?.program;
    const level = offering.academicLevel;
    if (!prog || !level) continue;
    const key = `${prog.id}-${level.id}`;
    if (!groups[key]) {
      groups[key] = { program: prog, level, offerings: [] };
    }
    groups[key].offerings.push(offering);
  }

  // Get time slots and classrooms
  const dbSlots = await TimeSlot.findAll({ where: { active: true }, order: [['startTime', 'ASC']] });
  if (dbSlots.length === 0) {
    return { success: false, error: 'No active time slots configured' };
  }

  const classrooms = await Classroom.findAll({ where: { status: 'Available' }, order: [['capacity', 'DESC']] });
  if (classrooms.length === 0) {
    return { success: false, error: 'No available classrooms' };
  }

  const timeList = dbSlots.map(s => s.startTime);
  const periodEnd = Object.fromEntries(dbSlots.map(s => [s.startTime, s.endTime]));
  const slotDays = dbSlots.map(s => s.days || DAYS);

  const allClashes = [];
  const allPlaced = [];

  // Generate timetable for each programme-level group
  for (const [groupKey, group] of Object.entries(groups)) {
    const sorted = [...group.offerings].sort((a, b) => {
      const aHours = a.course?.creditHours || 3;
      const bHours = b.course?.creditHours || 3;
      return bHours - aHours;
    });

    const lecturerBusy = {};   // day -> lecturerId -> Set(slotIdx)
    const classroomBusy = {};  // day -> roomId -> Set(slotIdx)
    const groupCells = {};     // day -> Set(slotIdx) already used by this group
    const schedule = {};

    const groupClashes = [];
    const groupPlaced = [];

    // Each course takes a single 2-hour block placed on a random day.
    // Days may hold 0, 1, 2, ... classes depending on how the shuffle lands.
    for (const offering of sorted) {
      const course = offering.course;
      const lecturerId = offering.lecturerId;
      if (!course || !lecturerId) continue;

      const isLab = course.type === 'lab';

      let placed = false;

      for (const day of shuffle(DAYS)) {
        if (placed) break;

        const blockIndices = dbSlots
          .map((s, i) => (slotDays[i].includes(day) ? i : -1))
          .filter(i => i >= 0);

        for (const t of shuffle(blockIndices)) {
          if (placed) break;

          if (groupCells[day]?.has(t)) continue;
          if (lecturerBusy[day]?.[lecturerId]?.has(t)) continue;

          // Find a suitable classroom (random order so classes spread across rooms)
          for (const room of shuffle(classrooms)) {
            if (isLab && room.type !== 'Lab') continue;
            if (!isLab && room.type === 'Lab') continue;
            if (room.capacity < (offering.numStudents || 30)) continue;
            if (classroomBusy[day]?.[room.id]?.has(t)) continue;

            if (!lecturerBusy[day]) lecturerBusy[day] = {};
            if (!lecturerBusy[day][lecturerId]) lecturerBusy[day][lecturerId] = new Set();
            lecturerBusy[day][lecturerId].add(t);

            if (!classroomBusy[day]) classroomBusy[day] = {};
            if (!classroomBusy[day][room.id]) classroomBusy[day][room.id] = new Set();
            classroomBusy[day][room.id].add(t);

            if (!groupCells[day]) groupCells[day] = new Set();
            groupCells[day].add(t);

            if (!schedule[day]) schedule[day] = {};
            if (!schedule[day][t]) schedule[day][t] = [];

            schedule[day][t].push({
              courseOfferingId: offering.id,
              courseId: course.id,
              lecturerId: lecturerId,
              classroomId: room.id,
              academicYearId: semester.academicYearId,
              semesterId: semester.id,
              programId: group.program.id,
              academicLevelId: group.level.id,
              day,
              startTime: timeList[t],
              endTime: periodEnd[timeList[t]] || timeList[t],
              timetableLabel: label
            });

            groupPlaced.push({
              courseCode: course.code,
              courseName: course.name,
              lecturerName: offering.lecturer?.name,
              room: room.name,
              day,
              startTime: timeList[t],
              endTime: periodEnd[timeList[t]] || timeList[t],
              programme: group.program.name,
              level: group.level.level
            });

            placed = true;
            break;
          }
        }
      }

      if (!placed) {
        groupClashes.push({
          courseCode: course.code,
          courseName: course.name,
          lecturerName: offering.lecturer?.name,
          numStudents: offering.numStudents,
          programme: group.program.name,
          level: group.level.level,
          reason: 'Could not find an available day, time block and classroom'
        });
      }
    }

    // Persist to database
    for (const day of Object.keys(schedule)) {
      for (const timeIdx of Object.keys(schedule[day])) {
        for (const entry of schedule[day][timeIdx]) {
          await TimetableSlot.create(entry);
        }
      }
    }

    allPlaced.push(...groupPlaced);
    allClashes.push(...groupClashes);
  }

  return {
    success: true,
    placedCount: allPlaced.length,
    clashes: allClashes,
    totalOfferings: filteredOfferings.length,
    groups: Object.values(groups).map(g => ({
      programme: g.program.name,
      level: g.level.level,
      courseCount: g.offerings.length
    })),
    label
  };
}

module.exports = { generateTimetable };
