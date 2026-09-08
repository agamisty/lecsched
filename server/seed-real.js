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

// batch a table's row tuples into a few multi-row INSERTs (much faster on serverless)
async function insertRows(table, cols, rows, chunk = 200) {
  const qcols = cols.map((c) => `"${c}"`).join(',');
  const qs = [];
  for (let i = 0; i < rows.length; i += chunk) {
    qs.push(`INSERT INTO "${table}" (${qcols}) VALUES ${rows.slice(i, i + chunk).join(',')}`);
  }
  await conc(qs, 10);
}

async function run() {
  // Idempotency guard: a fixed marker row (id 0) in GenerationHistories makes
  // concurrent cold starts / redeploys skip (only one instance seeds).
  const [[{ c: g }]] = await sequelize.query(
    `SELECT COUNT(*)::int AS c FROM "GenerationHistories" WHERE "id" = 0`
  );
  if (g > 0) {
    const [[row]] = await sequelize.query(
      `SELECT COUNT(*)::int AS c, MAX("createdAt") AS created FROM "GenerationHistories" WHERE "id" = 0`
    );
    const addedMs = new Date(row.created).getTime();
    const fresh = Date.now() - addedMs < 5 * 60 * 1000;
    if (row.c > 0 && fresh) {
      console.log('seed-real: already seeded (slots present), skipping');
      return;
    }
    // stale marker (crashed/aborted attempt older than 5 min) -> clear and retry
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
  // make sure the tables/columns the seed writes to exist, no matter what the
  // live schema drifted to (Postgres 9.6+ supports ADD COLUMN IF NOT EXISTS)
  const ensureCols = [
    ['Departments', ['facultyId', 'INTEGER'], ['headId', 'INTEGER']],
    ['Programs', ['departmentId', 'INTEGER'], ['duration', 'INTEGER']],
    ['Courses', ['departmentId', 'INTEGER'], ['programId', 'INTEGER'], ['creditHours', 'INTEGER']],
    ['AcademicLevels', ['programId', 'INTEGER'], ['level', 'INTEGER']],
    ['TimetableSlots', ['lecturerId', 'INTEGER'], ['classroomId', 'INTEGER'], ['academicYearId', 'INTEGER'], ['semesterId', 'INTEGER'], ['programId', 'INTEGER'], ['academicLevelId', 'INTEGER'], ['courseOfferingId', 'INTEGER']],
    ['CourseOfferings', ['lecturerId', 'INTEGER'], ['semesterId', 'INTEGER'], ['numStudents', 'INTEGER']],
    ['LecturerSchedules', ['lecturerId', 'INTEGER']],
  ];
  for (const [table, ...cols] of ensureCols) {
    for (const [col, type] of cols) {
      try {
        await sequelize.query(`ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "${col}" ${type}`);
      } catch (_) { /* table may not exist yet; model sync in bootstrap handles it */ }
    }
  }
  try {
  // ─────────────── FACULTY ───────────────
  await sequelize.query(
    `INSERT INTO "Faculties" ("id","name","code","description","createdAt","updatedAt") VALUES (1,'College of Science','COS','College of Science - Second Semester 2025/2026','${now}','${now}')`
  );
  console.log('Faculty seeded (1)');

  // ─────────────── DEPARTMENTS ───────────────
  {
    const [dcols] = await sequelize.query(
      `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'Departments' ORDER BY ordinal_position`
    );
    console.log('Departments columns:', JSON.stringify(dcols));
    const names = dcols.map((r) => r.column_name).join(',');
    if (!dcols.some((r) => r.column_name === 'facultyId' || r.column_name === 'facultyid')) {
      throw new Error(`Departments table missing facultyId column. Existing: ${names}`);
    }
  }
  const deptIdByCode = {};
  const deptRows = [];
  for (let i = 0; i < DEPARTMENTS.length; i++) {
    const d = DEPARTMENTS[i];
    const id = i + 1;
    deptIdByCode[d.code] = id;
    deptRows.push(`(${id},${sqlStr(d.name)},${sqlStr(d.code)},1,'Department of ${d.name}','${now}','${now}')`);
  }
  await insertRows('Departments', ['id','name','code','facultyId','description','createdAt','updatedAt'], deptRows);
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
  const programRows = [];
  for (let i = 0; i < programs.length; i++) {
    const pr = programs[i];
    const id = i + 1;
    const deptId = deptIdByCode[pr.dept] == null ? 14 : deptIdByCode[pr.dept];
    let code = `${pr.type}-${pr.dept || 'SRV'}`;
    let n = 2;
    while (usedCodes.has(code)) code = `${pr.type}-${pr.dept || 'SRV'}-${n++}`;
    usedCodes.add(code);
    programIdByName[pr.name] = id;
    programRows.push(`(${id},${sqlStr(pr.name)},${sqlStr(code)},${sqlStr(pr.type)},${deptId},${DURATION[pr.type] || 4},${sqlStr(`Programme from College of Science timetable (${pr.pages.length} class groups)`)} ,'${now}','${now}')`);
  }
  await insertRows('Programs', ['id','name','code','type','departmentId','duration','description','createdAt','updatedAt'], programRows);
  console.log(`Programs seeded (${programs.length})`);

  // ─────────────── ACADEMIC LEVELS ───────────────
  const levelIdByKey = {};
  const levels = DATASET.levels || [];
  const levelRows = [];
  for (let i = 0; i < levels.length; i++) {
    const l = levels[i];
    const id = i + 1;
    const pid = programIdByName[l.program];
    levelIdByKey[`${l.program}|${l.level}|${l.name}`] = id;
    levelRows.push(`(${id},${pid},${l.level},${sqlStr(l.name)},'${now}','${now}')`);
  }
  await insertRows('AcademicLevels', ['id','programId','level','name','createdAt','updatedAt'], levelRows);
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
  const classroomRows = [];
  let cid = 1;
  for (const c of DATASET.classrooms) {
    classroomIdByName[c.name] = cid;
    classroomRows.push(`(${cid},${sqlStr(c.name)},${c.capacity},${sqlStr('')},${sqlStr('')},${sqlStr(c.type)},'Available','${now}','${now}')`);
    cid++;
  }
  const tbaId = cid++;
  classroomIdByName['TBA'] = tbaId;
  classroomRows.push(`(${tbaId},'TBA',0,'','','TBA','Available','${now}','${now}')`);
  await insertRows('Classrooms', ['id','name','capacity','building','floor','type','status','createdAt','updatedAt'], classroomRows);
  console.log(`Classrooms seeded (${Object.keys(classroomIdByName).length})`);

  // ─────────────── COURSES ───────────────
  const courseIdByCode = {};
  const courseRows = [];
  for (let i = 0; i < DATASET.courses.length; i++) {
    const cr = DATASET.courses[i];
    const id = i + 1;
    const deptId = cr.dept ? deptIdByCode[cr.dept] : null;
    courseIdByCode[cr.code] = id;
    courseRows.push(`(${id},${sqlStr(cr.code)},${sqlStr(cr.code)},3,${sqlNum(deptId)},NULL,'lecture','${now}','${now}')`);
  }
  await insertRows('Courses', ['id','code','name','creditHours','departmentId','programId','type','createdAt','updatedAt'], courseRows);
  console.log(`Courses seeded (${DATASET.courses.length})`);

  // ─────────────── LECTURER USERS ───────────────
  const hashedPw = await bcrypt.hash(CREDENTIAL_PASS, 10);
  const cleanName = (n) =>
    String(n)
      .replace(/^[^A-Za-zÀ-ÿ]+/, '')
      .replace(/[^A-Za-zÀ-ÿ .,'’\-]+$/g, '')
      .trim();
  const lecturerIdByKey = {};
  let insertedLec = 0;
  {
    const lecturerRows = [];
    const emailByKey = [];
    for (const lec of DATASET.lecturers) {
      const email = `lecturer.${slug(lec.key)}@lecsched.app`;
      if (lecturerRows.some((r) => r.email === email)) continue;
      lecturerRows.push({ email, sql: `(${sqlStr(cleanName(lec.name))},'${email}','${hashedPw}','lecturer','','[]','','${now}','${now}')` });
      emailByKey.push(email);
    }
    if (lecturerRows.length) {
      const res = await sequelize.query(
        `INSERT INTO "Users" ("name","email","password","role","department","departments","avatar","createdAt","updatedAt") VALUES ${lecturerRows.map((r) => r.sql).join(',')} RETURNING "id"`
      );
      const idByEmail = {};
      for (let i = 0; i < res[0].length; i++) idByEmail[emailByKey[i]] = res[0][i].id;
      for (const lec of DATASET.lecturers) {
        lecturerIdByKey[lec.key] = idByEmail[`lecturer.${slug(lec.key)}@lecsched.app`];
      }
      insertedLec = res[0].length;
    }
  }
  // per-department staff fallback lecturers
  const staffIdByDept = {};
  const staffRows = [];
  const staffCodes = [];
  for (const d of DEPARTMENTS) {
    staffCodes.push(d.code);
    staffRows.push(
      `(${sqlStr(`${d.name} Staff`)},'staff.${d.code.toLowerCase()}@lecsched.app','${hashedPw}','lecturer',${sqlStr(d.name)},'[]','','${now}','${now}')`
    );
  }
  if (staffRows.length) {
    const sres = await sequelize.query(
      `INSERT INTO "Users" ("name","email","password","role","department","departments","avatar","createdAt","updatedAt") VALUES ${staffRows.join(',')} RETURNING "id"`
    );
    for (let i = 0; i < sres[0].length; i++) staffIdByDept[staffCodes[i]] = sres[0][i].id;
  }
  console.log(`Lecturers seeded (${insertedLec} + ${staffRows.length} dept staff)`);

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

  // ─────────────── MERGE 1-HOUR PERIODS INTO 2-HOUR PAIRS ───────────────
  // Classes occupy periods in fixed pairs: P1-P2, P3-P4, P5-P6, P7-P8, P9-P10.
  // The PDF grid stores each 1-hour period as its own row; a 2-hour class is two
  // rows of the same course on the same day that sit in one pair (index 0-1, 2-3,
  // 4-5, 6-7, 8-9). Merge such pairs into a single slot: start = first row start,
  // end = second row end. Never combine across different pairs (e.g. P2-P3).
  const PERIOD_STARTS = ['08:00','09:00','10:30','11:30','13:00','14:00','15:00','16:00','17:00','18:00'];
  const START_INDEX = {};
  PERIOD_STARTS.forEach((s, i) => { START_INDEX[s] = i; });
  function inSamePair(ia, ib) {
    return Math.floor(ia / 2) === Math.floor(ib / 2);
  }

  // group raw slots by page/day/course, then merge each group's 2-hour pairs
  const slotGroups = {};
  for (const slot of DATASET.slots) {
    const info = pageInfo[slot.page];
    if (!info || info.academicLevelId == null) continue;
    if (!courseIdByCode[slot.course]) continue;
    const key = `${slot.page}|${slot.day}|${slot.course}`;
    (slotGroups[key] = slotGroups[key] || []).push(slot);
  }
  const mergedSlots = [];
  for (const key of Object.keys(slotGroups)) {
    const group = slotGroups[key].slice().sort((a, b) => START_INDEX[a.time[0]] - START_INDEX[b.time[0]]);
    for (let g = 0; g < group.length; g++) {
      const slot = group[g];
      const ia = START_INDEX[slot.time[0]];
      const partner = group.find((x) => START_INDEX[x.time[0]] === ia + 1);
      if (ia % 2 === 0 && partner && inSamePair(ia, ia + 1)) {
        // even row with an odd partner in the same pair -> one 2-hour slot
        mergedSlots.push({
          page: slot.page,
          day: slot.day,
          time: [slot.time[0], partner.time[1]],
          course: slot.course,
          rooms: (slot.rooms && slot.rooms.length) ? slot.rooms : (partner.rooms || []),
          lecturers: slot.lecturers || partner.lecturers || [],
          label: slot.label,
        });
        g++;
      }
      // single-period rows (only one period of the pair occupied) are dropped
    }
  }
  console.log(`Slots after 2-hour pair merge: ${DATASET.slots.length} -> ${mergedSlots.length}`);

  // ─────────────── COURSE OFFERINGS (Semester 2 = current) ───────────────
  const offeringByKey = {}; // `${academicLevelId}:${courseId}` -> id
  const offeringRows = [];
  let offeringSeq = 0;
  for (const slot of mergedSlots) {
    const info = pageInfo[slot.page];
    const courseId = courseIdByCode[slot.course];
    const key = `${info.academicLevelId}:${courseId}`;
    if (!offeringByKey[key]) {
      offeringSeq++;
      const lecId = lecForSlot(slot, slot.page);
      offeringByKey[key] = offeringSeq;
      offeringRows.push(
        `(${offeringSeq},${courseId},${info.academicLevelId},2,${sqlNum(lecId)},0,'${now}','${now}')`
      );
    }
  }
  await insertRows('CourseOfferings', ['id','courseId','academicLevelId','semesterId','lecturerId','numStudents','createdAt','updatedAt'], offeringRows);
  console.log(`Course Offerings seeded (${offeringSeq})`);

  // ─────────────── TIMETABLE SLOTS ───────────────
  const slotRows = [];
  let sid = 0;
  const labelCounter = {};
  const nameForLabel = (lab) => {
    labelCounter[lab] = (labelCounter[lab] || 0) + 1;
    return lab || 'Main';
  };
  for (const slot of mergedSlots) {
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
    slotRows.push(
      `(${sid},${offeringId},${courseId},${lecturerId},${classroomId},1,2,${sqlNum(info.programId)},${info.academicLevelId},${sqlStr(slot.day)},'${slot.time[0]}','${slot.time[1]}',${sqlStr(nameForLabel(slot.label))},'${now}','${now}')`
    );
  }
  await insertRows('TimetableSlots', ['id','courseOfferingId','courseId','lecturerId','classroomId','academicYearId','semesterId','programId','academicLevelId','day','startTime','endTime','timetableLabel','createdAt','updatedAt'], slotRows);
  console.log(`Timetable Slots seeded (${sid})`);

  // ─────────────── LECTURER SCHEDULES (availability) ───────────────
  const allLecIds = Object.values(lecturerIdByKey).concat(Object.values(staffIdByDept));
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const scheduleRows = [];
  let scSeq = 0;
  for (const lecId of allLecIds) {
    for (const day of days) {
      scSeq++;
      scheduleRows.push(`(${scSeq},${lecId},'${day}','08:00','19:00','${now}','${now}')`);
    }
  }
  await insertRows('LecturerSchedules', ['id','lecturerId','day','startTime','endTime','createdAt','updatedAt'], scheduleRows);
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