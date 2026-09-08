const path = require('path');
const fs = require('fs');
const sequelize = require('./db');
const bcrypt = require('bcryptjs');
require('./models/associations');
const { ensureDefaultTimeSlots } = require('./scheduler/ensureSlots');

const CREDENTIAL_PASS = 'pass123';
const DATASET = JSON.parse(fs.readFileSync(path.join(__dirname, 'dataset.json'), 'utf8'));

const DEPARTMENTS = [
  { code: 'BBT', name: 'Biochemistry & Biotechnology' },
  { code: 'BIO', name: 'Biological Sciences' },
  { code: 'ENS', name: 'Environmental Science' },
  { code: 'OPV', name: 'Optometry & Visual Science' },
  { code: 'CHM', name: 'Chemistry' },
  { code: 'FST', name: 'Food Science & Technology' },
  { code: 'COM', name: 'Computer Science' },
  { code: 'IT', name: 'Information Technology' },
  { code: 'MTH', name: 'Mathematics' },
  { code: 'ACT', name: 'Actuarial Science' },
  { code: 'STT', name: 'Statistics' },
  { code: 'PHY', name: 'Physics' },
  { code: 'MET', name: 'Meteorology & Climate Science' },
];

async function clearAll() {
  const tables = [
    'TimetableSlots', 'LecturerSchedules', 'CourseOfferings',
    'GenerationHistories', 'Messages', 'Courses', 'AcademicLevels',
    'Semesters', 'AcademicYears', 'Programs', 'Floors', 'Classrooms',
    'Departments', 'Buildings', 'Faculties',
  ];
  for (const t of tables) {
    await sequelize.query(`DELETE FROM "${t}"`);
  }
  await sequelize.query(`DELETE FROM "Users" WHERE "role" = 'lecturer'`);
  console.log('All demo data cleared (admin + time slots preserved)');
}

function tsNow() { return new Date().toISOString(); }
function sqlNum(v) { return v == null ? 'NULL' : String(v); }
function sqlStr(v) { return v == null ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`; }
function sqlBool(v) { return v ? 'TRUE' : 'FALSE'; }
function sqlJson(v) { return `'${JSON.stringify(v).replace(/'/g, "''")}'::json`; }

function slug(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// run a list of SQL query strings with limited concurrency (keeps serverless fast)
async function conc(queries, n) {
  if (!queries.length) return;
  let i = 0;
  const workers = Array.from({ length: Math.min(n, queries.length) }, async () => {
    while (i < queries.length) {
      const q = queries[i++];
      await sequelize.query(q);
    }
  });
  await Promise.all(workers);
}

async function run() {
  // Idempotency guard: a fixed marker row (id 0) in GenerationHistories makes
  // concurrent cold starts / redeploys skip (only one instance seeds).
  const [[{ c: g }]] = await sequelize.query(
    `SELECT COUNT(*)::int AS c FROM "GenerationHistories" WHERE "id" = 0`
  );
  if (g > 0) {
    const [[{ c: s }]] = await sequelize.query(
      `SELECT COUNT(*)::int AS c FROM "TimetableSlots"`
    );
    if (s > 0) {
      console.log('seed-real: already seeded (slots present), skipping');
      return;
    }
    // stale marker from a crashed attempt -> clear and retry
    await sequelize.query(`DELETE FROM "GenerationHistories" WHERE "id" = 0`);
  }

  await clearAll();

  const now = tsNow();
  try {
    await sequelize.query(
      `INSERT INTO "GenerationHistories" ("id","placedCount","clashCount","totalOfferings","groups","label","status","createdAt","updatedAt") VALUES (0,0,0,0,'[]','seed-marker','success','${now}','${now}')`
    );
  } catch (e) {
    console.log('seed-real: another instance is seeding, skipping');
    return;
  }

  await ensureDefaultTimeSlots();
  try {
  // ─────────────── FACULTY ───────────────
  await sequelize.query(
    `INSERT INTO "Faculties" ("id","name","code","description","createdAt","updatedAt") VALUES (1,'College of Science','COS','College of Science - Second Semester 2025/2026','${now}','${now}')`
  );
  console.log('Faculty seeded (1)');

  // ─────────────── DEPARTMENTS ───────────────
  const deptIdByCode = {};
  let qs = [];
  for (let i = 0; i < DEPARTMENTS.length; i++) {
    const d = DEPARTMENTS[i];
    const id = i + 1;
    deptIdByCode[d.code] = id;
    qs.push(
      `INSERT INTO "Departments" ("id","name","code","facultyId","description","createdAt","updatedAt") VALUES (${id},${sqlStr(d.name)},${sqlStr(d.code)},1,'Department of ${d.name}','${now}','${now}')`
    );
  }
  await conc(qs, 10);
  console.log(`Departments seeded (${DEPARTMENTS.length})`);

  // ─────────────── ACADEMIC YEARS & SEMESTERS ───────────────
  await sequelize.query(
    `INSERT INTO "AcademicYears" ("id","name","startDate","endDate","isCurrent","createdAt","updatedAt") VALUES (1,'2025/2026','2025-09-01','2026-06-30',TRUE,'${now}','${now}')`
  );
  await sequelize.query(
    `INSERT INTO "AcademicYears" ("id","name","startDate","endDate","isCurrent","createdAt","updatedAt") VALUES (2,'2024/2025','2024-09-01','2025-06-30',FALSE,'${now}','${now}')`
  );
  await sequelize.query(
    `INSERT INTO "Semesters" ("id","name","academicYearId","isCurrent","createdAt","updatedAt") VALUES (1,'Semester 1',1,FALSE,'${now}','${now}')`
  );
  await sequelize.query(
    `INSERT INTO "Semesters" ("id","name","academicYearId","isCurrent","createdAt","updatedAt") VALUES (2,'Semester 2',1,TRUE,'${now}','${now}')`
  );
  console.log('Academic years + semesters seeded');

  // ─────────────── PROGRAMS ───────────────
  const DURATION = { BSc: 4, Doctor: 6, MSc: 2, MPhil: 2, PhD: 3 };
  const programIdByName = {};
  const usedCodes = new Set();
  const programs = DATASET.programs || [];
  qs = [];
  for (let i = 0; i < programs.length; i++) {
    const pr = programs[i];
    const id = i + 1;
    const deptId = deptIdByCode[pr.dept] == null ? 14 : deptIdByCode[pr.dept];
    let code = `${pr.type}-${pr.dept || 'SRV'}`;
    let n = 2;
    while (usedCodes.has(code)) code = `${pr.type}-${pr.dept || 'SRV'}-${n++}`;
    usedCodes.add(code);
    programIdByName[pr.name] = id;
    qs.push(
      `INSERT INTO "Programs" ("id","name","code","type","departmentId","duration","description","createdAt","updatedAt") VALUES (${id},${sqlStr(pr.name)},${sqlStr(code)},${sqlStr(pr.type)},${deptId},${DURATION[pr.type] || 4},${sqlStr(`Programme from College of Science timetable (${pr.pages.length} class groups)`)} ,'${now}','${now}')`
    );
  }
  await conc(qs, 10);
  console.log(`Programs seeded (${programs.length})`);

  // ─────────────── ACADEMIC LEVELS ───────────────
  const levelIdByKey = {};
  const levels = DATASET.levels || [];
  qs = [];
  for (let i = 0; i < levels.length; i++) {
    const l = levels[i];
    const id = i + 1;
    const pid = programIdByName[l.program];
    levelIdByKey[`${l.program}|${l.level}|${l.name}`] = id;
    qs.push(
      `INSERT INTO "AcademicLevels" ("id","programId","level","name","createdAt","updatedAt") VALUES (${id},${pid},${l.level},${sqlStr(l.name)},'${now}','${now}')`
    );
  }
  await conc(qs, 10);
  console.log(`Academic Levels seeded (${levels.length})`);

  // page -> academicLevelId + programId + dept (for slots)
  const pageInfo = {};
  for (const c of DATASET.classes) {
    pageInfo[c.page] = {
      programId: programIdByName[c.program],
      academicLevelId: levelIdByKey[`${c.program}|${c.level}|${c.level_name}`],
      program: c.program,
      dept: (DATASET.programs.find((p) => p.name === c.program) || {}).dept || '',
    };
  }

  // ─────────────── CLASSROOMS ───────────────
  const classroomIdByName = {};
  let cid = 1;
  qs = [];
  for (const c of DATASET.classrooms) {
    classroomIdByName[c.name] = cid;
    qs.push(
      `INSERT INTO "Classrooms" ("id","name","capacity","building","floor","type","status","createdAt","updatedAt") VALUES (${cid},${sqlStr(c.name)},${c.capacity},${sqlStr('')},${sqlStr('')},${sqlStr(c.type)},'Available','${now}','${now}')`
    );
    cid++;
  }
  const tbaId = cid++;
  classroomIdByName['TBA'] = tbaId;
  qs.push(
    `INSERT INTO "Classrooms" ("id","name","capacity","building","floor","type","status","createdAt","updatedAt") VALUES (${tbaId},'TBA',0,'','','TBA','Available','${now}','${now}')`
  );
  await conc(qs, 10);
  console.log(`Classrooms seeded (${Object.keys(classroomIdByName).length})`);

  // ─────────────── COURSES ───────────────
  const courseIdByCode = {};
  qs = [];
  for (let i = 0; i < DATASET.courses.length; i++) {
    const cr = DATASET.courses[i];
    const id = i + 1;
    const deptId = cr.dept ? deptIdByCode[cr.dept] : null;
    courseIdByCode[cr.code] = id;
    qs.push(
      `INSERT INTO "Courses" ("id","code","name","creditHours","departmentId","programId","type","createdAt","updatedAt") VALUES (${id},${sqlStr(cr.code)},${sqlStr(cr.code)},3,${sqlNum(deptId)},NULL,'lecture','${now}','${now}')`
    );
  }
  await conc(qs, 10);
  console.log(`Courses seeded (${DATASET.courses.length})`);

  // ─────────────── LECTURER USERS ───────────────
  const hashedPw = await bcrypt.hash(CREDENTIAL_PASS, 10);
  const lecturerIdByKey = {};
  for (const lec of DATASET.lecturers) {
    const email = `lecturer.${slug(lec.key)}@lecsched.app`;
    const res = await sequelize.query(
      `INSERT INTO "Users" ("name","email","password","role","department","departments","avatar","createdAt","updatedAt") VALUES (${sqlStr(lec.name)},'${email}', '${hashedPw}','lecturer','', '[]','','${now}','${now}') RETURNING "id"`
    );
    lecturerIdByKey[lec.key] = res[0][0].id;
  }
  // per-department staff fallback lecturers
  const staffIdByDept = {};
  for (const d of DEPARTMENTS) {
    const email = `staff.${d.code.toLowerCase()}@lecsched.app`;
    const res = await sequelize.query(
      `INSERT INTO "Users" ("name","email","password","role","department","departments","avatar","createdAt","updatedAt") VALUES (${sqlStr(`${d.name} Staff`)},'${email}','${hashedPw}','lecturer',${sqlStr(d.name)},'[]','','${now}','${now}') RETURNING "id"`
    );
    staffIdByDept[d.code] = res[0][0].id;
  }
  console.log(`Lecturers seeded (${DATASET.lecturers.length} + ${DEPARTMENTS.length} dept staff)`);

  // helper: lecturer id for a slot (real name first, else class dept staff)
  const lectKey = (nm) => {
    const w = String(nm).toLowerCase().replace(/\./g, ' ').trim().split(/\s+/);
    return w[w.length - 1] || '';
  };
  const lecForSlot = (slot, page) => {
    if (slot.lecturers && slot.lecturers.length) {
      for (const nm of slot.lecturers) {
        if (lecturerIdByKey[lectKey(nm)] != null) return lecturerIdByKey[lectKey(nm)];
      }
    }
    const p = pageInfo[page];
    return staffIdByDept[p.dept] || null;
  };

  // ─────────────── COURSE OFFERINGS (Semester 2 = current) ───────────────
  const offeringByKey = {}; // `${academicLevelId}:${courseId}` -> id
  let offeringSeq = 0;
  qs = [];
  for (const slot of DATASET.slots) {
    const info = pageInfo[slot.page];
    const courseId = courseIdByCode[slot.course];
    const key = `${info.academicLevelId}:${courseId}`;
    if (!offeringByKey[key]) {
      offeringSeq++;
      const lecId = lecForSlot(slot, slot.page);
      offeringByKey[key] = offeringSeq;
      qs.push(
        `INSERT INTO "CourseOfferings" ("id","courseId","academicLevelId","semesterId","lecturerId","numStudents","createdAt","updatedAt") VALUES (${offeringSeq},${courseId},${info.academicLevelId},2,${sqlNum(lecId)},0,'${now}','${now}')`
      );
    }
  }
  await conc(qs, 15);
  console.log(`Course Offerings seeded (${offeringSeq})`);

  // ─────────────── TIMETABLE SLOTS ───────────────
  let sid = 0;
  const labelCounter = {};
  const nameForLabel = (lab) => {
    labelCounter[lab] = (labelCounter[lab] || 0) + 1;
    return lab || 'Main';
  };
  qs = [];
  for (const slot of DATASET.slots) {
    const info = pageInfo[slot.page];
    if (!info || info.academicLevelId == null) {
      console.error(`!! missing class info for page ${slot.page}`);
      continue;
    }
    const courseId = courseIdByCode[slot.course];
    if (!courseId) {
      console.error(`!! missing course ${slot.course} (page ${slot.page})`);
      continue;
    }
    const offeringId = offeringByKey[`${info.academicLevelId}:${courseId}`];
    const classroomId = (slot.rooms && slot.rooms.length) ? classroomIdByName[slot.rooms[0]] : tbaId;
    if (classroomId == null) {
      console.error(`!! missing room ${slot.rooms} (page ${slot.page})`);
      continue;
    }
    const lecturerId = lecForSlot(slot, slot.page);
    sid++;
    qs.push(
      `INSERT INTO "TimetableSlots" ("id","courseOfferingId","courseId","lecturerId","classroomId","academicYearId","semesterId","programId","academicLevelId","day","startTime","endTime","timetableLabel","createdAt","updatedAt") VALUES (${sid},${offeringId},${courseId},${lecturerId},${classroomId},1,2,${sqlNum(info.programId)},${info.academicLevelId},${sqlStr(slot.day)},'${slot.time[0]}','${slot.time[1]}',${sqlStr(nameForLabel(slot.label))},'${now}','${now}')`
    );
  }
  await conc(qs, 15);
  console.log(`Timetable Slots seeded (${sid})`);

  // ─────────────── LECTURER SCHEDULES (availability) ───────────────
  const allLecIds = Object.values(lecturerIdByKey).concat(Object.values(staffIdByDept));
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  let scSeq = 0;
  qs = [];
  for (const lecId of allLecIds) {
    for (const day of days) {
      scSeq++;
      qs.push(
        `INSERT INTO "LecturerSchedules" ("id","lecturerId","day","startTime","endTime","createdAt","updatedAt") VALUES (${scSeq},${lecId},'${day}','08:00','19:00','${now}','${now}')`
      );
    }
  }
  await conc(qs, 15);
  console.log(`Lecturer Schedules seeded (${scSeq})`);

  // ─────────────── GENERATION HISTORY ───────────────
  await sequelize.query(
    `INSERT INTO "GenerationHistories" ("id","semesterId","academicYearId","placedCount","clashCount","totalOfferings","groups","label","status","generatedBy","createdAt","updatedAt") VALUES (1,2,1,${sid},0,${sid},'[]','College of Science Real Timetable','success',1,'${now}','${now}')`
  );
  await sequelize.query(`DELETE FROM "GenerationHistories" WHERE "id" = 0`);
  console.log('Generation History seeded (1)');

  // ─────────────── SUMMARY ───────────────
  console.log('\n=== Real Data Seed Complete ===');
  console.log('Semester 2 (2025/2026) is current; all slots reference it.');
  console.log(`Departments: ${DEPARTMENTS.length}`);
  console.log(`Programs: ${programs.length}`);
  console.log(`Academic Levels: ${levels.length}`);
  console.log(`Classrooms: ${Object.keys(classroomIdByName).length} (incl. TBA)`);
  console.log(`Courses: ${DATASET.courses.length}`);
  console.log(`Lecturers: ${DATASET.lecturers.length} + ${DEPARTMENTS.length} dept staff`);
  console.log(`Course Offerings: ${offeringSeq}`);
  console.log(`Timetable Slots: ${sid}`);
  console.log(`Lecturer Schedules: ${scSeq}`);
  console.log('All lecturer accounts use password: pass123');
  } catch (err) {
    try { await sequelize.query(`DELETE FROM "GenerationHistories" WHERE "id" = 0`); } catch (_) {}
    throw err;
  }
}

module.exports = { run };

if (require.main === module) {
  (async () => {
    try {
      await run();
    } catch (err) {
      console.error('Seed failed:', err.message);
      process.exitCode = 1;
    } finally {
      await sequelize.close();
    }
  })();
}