const sequelize = require('./db');
const bcrypt = require('bcryptjs');
require('./models/associations');
const { ensureDefaultTimeSlots } = require('./scheduler/ensureSlots');

const CREDENTIAL_PASS = 'pass123';

// Lecturers are inserted first (in reference order) and their auto IDs are captured.
// They are ordered group-wise so we can reference them by index.
const LECTURERS = [
  // FEC - Computer Science
  { name: 'Dr. Kwame Asante', email: 'kwame.asante@lec.com', department: 'Computer Science' },
  { name: 'Dr. Abena Mensah', email: 'abena.mensah@lec.com', department: 'Computer Science' },
  { name: 'Prof. Kofi Boateng', email: 'kofi.boateng@lec.com', department: 'Electronics & Communications' },
  { name: 'Dr. Akua Osei', email: 'akua.osei@lec.com', department: 'Electronics & Communications' },
  { name: 'Dr. Yaw Frimpong', email: 'yaw.frimpong@lec.com', department: 'Mechanical Engineering' },
  { name: 'Prof. Adwoa Dufie', email: 'adwoa.dufie@lec.com', department: 'Civil Engineering' },
  { name: 'Dr. Kwesi Poku', email: 'kwesi.poku@lec.com', department: 'Business Administration' },
  { name: 'Dr. Ama Sarfo', email: 'ama.sarfo@lec.com', department: 'Accounting' },
  // FBSS - more
  { name: 'Prof. Esi Amankwah', email: 'esi.amankwah@lec.com', department: 'Economics' },
  { name: 'Dr. Nana Adjei', email: 'nana.adjei@lec.com', department: 'Mathematics' },
  { name: 'Dr. Efua Quansah', email: 'efua.quansah@lec.com', department: 'Mechanical Engineering' },
  { name: 'Prof. Kweku Mensa', email: 'kweku.mensa@lec.com', department: 'Civil Engineering' },
  { name: 'Dr. Afua Gyasi', email: 'afua.gyasi@lec.com', department: 'Economics' },
  { name: 'Dr. Yaw Boateng', email: 'yaw.boateng.jr@lec.com', department: 'Mathematics' },
];

// Fixed programme "type" values used by the app
const LEVEL_DEFS = [[100, 'Level 100'], [200, 'Level 200'], [300, 'Level 300'], [400, 'Level 400']];

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

async function run() {
  await clearAll();
  await ensureDefaultTimeSlots();
  const now = tsNow();

  // ─────────────── FACULTIES ───────────────
  const faculties = [
    { id: 1, name: 'Faculty of Engineering & Computing', code: 'FEC', description: 'Engineering, computing and applied sciences programmes' },
    { id: 2, name: 'Faculty of Business & Social Sciences', code: 'FBSS', description: 'Business, management, economics and social science programmes' },
    { id: 3, name: 'Faculty of Health Sciences', code: 'FHS', description: 'Medical, nursing and health-related programmes' },
    { id: 4, name: 'Faculty of Arts & Humanities', code: 'FAH', description: 'Humanities, languages, law and education programmes' },
  ];
  for (const f of faculties) {
    await sequelize.query(
      `INSERT INTO "Faculties" ("id","name","code","description","createdAt","updatedAt") VALUES (${sqlNum(f.id)},${sqlStr(f.name)},${sqlStr(f.code)},${sqlStr(f.description)},'${now}','${now}')`
    );
  }
  console.log(`Faculties seeded (${faculties.length})`);

  // ─────────────── DEPARTMENTS ───────────────
  const departments = [
    { id: 1,  name: 'Computer Science',            code: 'CS',  facultyId: 1, description: 'Department of Computer Science' },
    { id: 2,  name: 'Electronics & Communications', code: 'EC', facultyId: 1, description: 'Department of Electronics & Communications Engineering' },
    { id: 3,  name: 'Mechanical Engineering',      code: 'ME', facultyId: 1, description: 'Department of Mechanical Engineering' },
    { id: 4,  name: 'Civil Engineering',           code: 'CV', facultyId: 1, description: 'Department of Civil Engineering' },
    { id: 5,  name: 'Business Administration',     code: 'BA', facultyId: 2, description: 'Department of Business Administration' },
    { id: 6,  name: 'Accounting',                  code: 'AC', facultyId: 2, description: 'Department of Accounting' },
    { id: 7,  name: 'Economics',                   code: 'ECO', facultyId: 2, description: 'Department of Economics' },
    { id: 8,  name: 'Mathematics',                 code: 'MATH', facultyId: 2, description: 'Department of Mathematics & Statistics' },
    { id: 9,  name: 'Nursing',                     code: 'NUR', facultyId: 3, description: 'Department of Nursing Science' },
    { id: 10, name: 'Medical Laboratory Science',   code: 'MLS', facultyId: 3, description: 'Department of Medical Laboratory Science' },
  ];
  for (const d of departments) {
    await sequelize.query(
      `INSERT INTO "Departments" ("id","name","code","facultyId","description","createdAt","updatedAt") VALUES (${sqlNum(d.id)},${sqlStr(d.name)},${sqlStr(d.code)},${sqlNum(d.facultyId)},${sqlStr(d.description)},'${now}','${now}')`
    );
  }
  console.log(`Departments seeded (${departments.length})`);

  // ─────────────── PROGRAMS ───────────────
  const programs = [
    { id: 1,  name: 'BSc Computer Science',            code: 'BSc-CS',   type: 'BSc', departmentId: 1, duration: 4, description: 'Four-year computer science degree' },
    { id: 2,  name: 'BSc Electrical Engineering',      code: 'BSc-EE',   type: 'BSc', departmentId: 2, duration: 4, description: 'Four-year electronics & communications degree' },
    { id: 3,  name: 'BSc Mechanical Engineering',      code: 'BSc-ME',   type: 'BSc', departmentId: 3, duration: 4, description: 'Four-year mechanical engineering degree' },
    { id: 4,  name: 'BSc Civil Engineering',           code: 'BSc-CV',   type: 'BSc', departmentId: 4, duration: 4, description: 'Four-year civil engineering degree' },
    { id: 5,  name: 'Bachelor of Business Administration', code: 'BBA', type: 'BBA', departmentId: 5, duration: 4, description: 'Four-year business administration degree' },
    { id: 6,  name: 'BSc Accounting',                  code: 'BSc-AC',   type: 'BSc', departmentId: 6, duration: 4, description: 'Four-year accounting degree' },
    { id: 7,  name: 'BSc Economics',                   code: 'BSc-ECO',  type: 'BSc', departmentId: 7, duration: 4, description: 'Four-year economics degree' },
    { id: 8,  name: 'BSc Mathematics & Statistics',    code: 'BSc-MATH', type: 'BSc', departmentId: 8, duration: 4, description: 'Four-year mathematics degree' },
    { id: 9,  name: 'BSc Nursing',                     code: 'BSc-NUR',  type: 'BSc', departmentId: 9, duration: 4, description: 'Four-year nursing science degree' },
    { id: 10, name: 'BSc Medical Laboratory Science',  code: 'BSc-MLS',  type: 'BSc', departmentId: 10, duration: 4, description: 'Four-year medical laboratory science degree' },
    { id: 11, name: 'MSc Computer Science',            code: 'MSc-CS',   type: 'MSc', departmentId: 1, duration: 2, description: 'Two-year postgraduate computer science degree' },
  ];
  for (const p of programs) {
    await sequelize.query(
      `INSERT INTO "Programs" ("id","name","code","type","departmentId","duration","description","createdAt","updatedAt") VALUES (${sqlNum(p.id)},${sqlStr(p.name)},${sqlStr(p.code)},${sqlStr(p.type)},${sqlNum(p.departmentId)},${sqlNum(p.duration)},${sqlStr(p.description)},'${now}','${now}')`
    );
  }
  console.log(`Programs seeded (${programs.length})`);

  // ─────────────── ACADEMIC LEVELS ───────────────
  const levels = [];
  let lid = 1;
  for (const pid of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) {
    for (const [lv, nm] of LEVEL_DEFS) {
      levels.push({ id: lid++, programId: pid, level: lv, name: nm });
    }
  }
  // MSc programme levels
  for (const [lv, nm] of [[500, 'Level 500'], [600, 'Level 600']]) {
    levels.push({ id: lid++, programId: 11, level: lv, name: nm });
  }
  for (const l of levels) {
    await sequelize.query(
      `INSERT INTO "AcademicLevels" ("id","programId","level","name","createdAt","updatedAt") VALUES (${l.id},${l.programId},${l.level},${sqlStr(l.name)},'${now}','${now}')`
    );
  }
  console.log(`Academic Levels seeded (${levels.length})`);

  // ─────────────── ACADEMIC YEARS ───────────────
  await sequelize.query(
    `INSERT INTO "AcademicYears" ("id","name","startDate","endDate","isCurrent","createdAt","updatedAt") VALUES (1,'2025/2026','2025-09-01','2026-06-30',TRUE,'${now}','${now}')`
  );
  await sequelize.query(
    `INSERT INTO "AcademicYears" ("id","name","startDate","endDate","isCurrent","createdAt","updatedAt") VALUES (2,'2024/2025','2024-09-01','2025-06-30',FALSE,'${now}','${now}')`
  );
  console.log('Academic Years seeded (2)');

  // ─────────────── SEMESTERS ───────────────
  await sequelize.query(
    `INSERT INTO "Semesters" ("id","name","academicYearId","isCurrent","createdAt","updatedAt") VALUES (1,'Semester 1',1,TRUE,'${now}','${now}')`
  );
  await sequelize.query(
    `INSERT INTO "Semesters" ("id","name","academicYearId","isCurrent","createdAt","updatedAt") VALUES (2,'Semester 2',1,FALSE,'${now}','${now}')`
  );
  console.log('Semesters seeded');

  // ─────────────── BUILDINGS & FLOORS ───────────────
  const buildings = [
    { id: 1, name: 'Science Block', code: 'SB', address: 'Main Campus East', floors: 4, capacity: 1200, status: 'Active' },
    { id: 2, name: 'Engineering Block', code: 'EB', address: 'Main Campus North', floors: 3, capacity: 800, status: 'Active' },
    { id: 3, name: 'Business School', code: 'BS', address: 'Main Campus West', floors: 3, capacity: 600, status: 'Active' },
    { id: 4, name: 'Auditorium', code: 'AUD', address: 'Main Campus Centre', floors: 1, capacity: 2000, status: 'Active' },
    { id: 5, name: 'Admin Block', code: 'AB', address: 'Main Campus South', floors: 2, capacity: 400, status: 'Active' },
    { id: 6, name: 'Health Sciences Complex', code: 'HSC', address: 'North Campus', floors: 4, capacity: 900, status: 'Active' },
    { id: 7, name: 'Languages & Humanities Building', code: 'LHB', address: 'South Campus', floors: 2, capacity: 500, status: 'Active' },
  ];
  for (const b of buildings) {
    await sequelize.query(
      `INSERT INTO "Buildings" ("id","name","code","address","floors","capacity","status","createdAt","updatedAt") VALUES (${b.id},${sqlStr(b.name)},${sqlStr(b.code)},${sqlStr(b.address)},${b.floors},${b.capacity},${sqlStr(b.status)},'${now}','${now}')`
    );
  }
  console.log(`Buildings seeded (${buildings.length})`);

  const floors = [];
  let fid = 1;
  for (const b of buildings) {
    for (let f = 1; f <= b.floors; f++) {
      floors.push({ id: fid++, buildingId: b.id, name: `Floor ${f}`, status: 'Active', rooms: f === b.floors ? 4 : 6, description: `${b.name} Floor ${f}` });
    }
  }
  for (const fl of floors) {
    await sequelize.query(
      `INSERT INTO "Floors" ("id","buildingId","name","status","description","rooms","createdAt","updatedAt") VALUES (${fl.id},${sqlNum(fl.buildingId)},${sqlStr(fl.name)},${sqlStr(fl.status)},${sqlStr(fl.description)},${fl.rooms},'${now}','${now}')`
    );
  }
  console.log(`Floors seeded (${floors.length})`);

  // ─────────────── CLASSROOMS ───────────────
  const classrooms = [
    { id: 1,  name: 'SB-F1-LH01', capacity: 200, building: 'Science Block', floor: 'Floor 1', type: 'Lecture Hall', status: 'Available' },
    { id: 2,  name: 'SB-F2-LH02', capacity: 150, building: 'Science Block', floor: 'Floor 2', type: 'Lecture Hall', status: 'Available' },
    { id: 3,  name: 'SB-F3-CR01', capacity: 60,  building: 'Science Block', floor: 'Floor 3', type: 'Classroom', status: 'Available' },
    { id: 4,  name: 'SB-F3-CR02', capacity: 60,  building: 'Science Block', floor: 'Floor 3', type: 'Classroom', status: 'Available' },
    { id: 5,  name: 'SB-F4-LAB01', capacity: 40, building: 'Science Block', floor: 'Floor 4', type: 'Laboratory', status: 'Available' },
    { id: 6,  name: 'SB-F4-LAB02', capacity: 40, building: 'Science Block', floor: 'Floor 4', type: 'Laboratory', status: 'Available' },
    { id: 7,  name: 'EB-F1-LH01', capacity: 180, building: 'Engineering Block', floor: 'Floor 1', type: 'Lecture Hall', status: 'Available' },
    { id: 8,  name: 'EB-F2-CR01', capacity: 80,  building: 'Engineering Block', floor: 'Floor 2', type: 'Classroom', status: 'Available' },
    { id: 9,  name: 'EB-F3-CR01', capacity: 60,  building: 'Engineering Block', floor: 'Floor 3', type: 'Classroom', status: 'Available' },
    { id: 10, name: 'EB-F3-LAB01', capacity: 45, building: 'Engineering Block', floor: 'Floor 3', type: 'Laboratory', status: 'Available' },
    { id: 11, name: 'BS-F1-LH01', capacity: 150, building: 'Business School', floor: 'Floor 1', type: 'Lecture Hall', status: 'Available' },
    { id: 12, name: 'BS-F2-CR01', capacity: 70,  building: 'Business School', floor: 'Floor 2', type: 'Classroom', status: 'Available' },
    { id: 13, name: 'BS-F2-CR02', capacity: 55,  building: 'Business School', floor: 'Floor 2', type: 'Classroom', status: 'Available' },
    { id: 14, name: 'BS-F3-CR01', capacity: 40,  building: 'Business School', floor: 'Floor 3', type: 'Seminar Room', status: 'Available' },
    { id: 15, name: 'AUD-LH01', capacity: 500, building: 'Auditorium', floor: 'Floor 1', type: 'Lecture Hall', status: 'Available' },
    { id: 16, name: 'AUD-LH02', capacity: 400, building: 'Auditorium', floor: 'Floor 1', type: 'Lecture Hall', status: 'Available' },
    { id: 17, name: 'AB-F1-CR01', capacity: 50, building: 'Admin Block', floor: 'Floor 1', type: 'Classroom', status: 'Available' },
    { id: 18, name: 'HSC-F1-LH01', capacity: 120, building: 'Health Sciences Complex', floor: 'Floor 1', type: 'Lecture Hall', status: 'Available' },
    { id: 19, name: 'HSC-F2-LAB01', capacity: 50, building: 'Health Sciences Complex', floor: 'Floor 2', type: 'Laboratory', status: 'Available' },
    { id: 20, name: 'HSC-F3-CR01', capacity: 40, building: 'Health Sciences Complex', floor: 'Floor 3', type: 'Classroom', status: 'Available' },
    { id: 21, name: 'LHB-F1-LH01', capacity: 100, building: 'Languages & Humanities Building', floor: 'Floor 1', type: 'Lecture Hall', status: 'Available' },
    { id: 22, name: 'LHB-F2-CR01', capacity: 45, building: 'Languages & Humanities Building', floor: 'Floor 2', type: 'Classroom', status: 'Available' },
  ];
  for (const c of classrooms) {
    await sequelize.query(
      `INSERT INTO "Classrooms" ("id","name","capacity","building","floor","type","status","createdAt","updatedAt") VALUES (${c.id},${sqlStr(c.name)},${c.capacity},${sqlStr(c.building)},${sqlStr(c.floor)},${sqlStr(c.type)},${sqlStr(c.status)},'${now}','${now}')`
    );
  }
  console.log(`Classrooms seeded (${classrooms.length})`);

  // ─────────────── LECTURERS (Users) ───────────────
  const hashedPw = await bcrypt.hash(CREDENTIAL_PASS, 10);
  const lecturerIds = [];
  for (const lec of LECTURERS) {
    const result = await sequelize.query(
      `INSERT INTO "Users" ("name","email","password","role","department","departments","avatar","createdAt","updatedAt") VALUES (${sqlStr(lec.name)},${sqlStr(lec.email)},'${hashedPw}','lecturer',${sqlStr(lec.department)},'[]','','${now}','${now}') RETURNING "id"`
    );
    lecturerIds.push(result[0][0].id);
  }
  console.log(`Lecturers seeded (${lecturerIds.length})`);

  // ─────────────── ASSIGN DEPARTMENT HEADS ───────────────
  const headMap = { 1: lecturerIds[0], 2: lecturerIds[2], 3: lecturerIds[4], 4: lecturerIds[5], 5: lecturerIds[6], 6: lecturerIds[7], 7: lecturerIds[8], 8: lecturerIds[9], 9: lecturerIds[8], 10: lecturerIds[8] };
  for (const [deptId, headId] of Object.entries(headMap)) {
    await sequelize.query(
      `UPDATE "Departments" SET "headId" = ${headId} WHERE "id" = ${deptId}`
    );
  }
  console.log('Department heads assigned');

  // ─────────────── COURSES ───────────────
  const courses = [
    // CS dept (dept 1, program 1)
    { id: 1,  code: 'CS101', name: 'Introduction to Programming',           creditHours: 3, departmentId: 1, programId: 1, type: 'lecture' },
    { id: 2,  code: 'CS102', name: 'Programming Laboratory',                creditHours: 1, departmentId: 1, programId: 1, type: 'lab' },
    { id: 3,  code: 'CS201', name: 'Data Structures & Algorithms',          creditHours: 3, departmentId: 1, programId: 1, type: 'lecture' },
    { id: 4,  code: 'CS202', name: 'Object-Oriented Programming',           creditHours: 3, departmentId: 1, programId: 1, type: 'lecture' },
    { id: 5,  code: 'CS203', name: 'OOP Laboratory',                        creditHours: 1, departmentId: 1, programId: 1, type: 'lab' },
    { id: 6,  code: 'CS301', name: 'Database Systems',                      creditHours: 3, departmentId: 1, programId: 1, type: 'lecture' },
    { id: 7,  code: 'CS302', name: 'Operating Systems',                     creditHours: 3, departmentId: 1, programId: 1, type: 'lecture' },
    { id: 8,  code: 'CS401', name: 'Software Engineering',                  creditHours: 3, departmentId: 1, programId: 1, type: 'lecture' },
    { id: 9,  code: 'CS410', name: 'Machine Learning',                      creditHours: 3, departmentId: 1, programId: 1, type: 'lecture' },
    { id: 10, code: 'CS601', name: 'Advanced Distributed Systems',          creditHours: 3, departmentId: 1, programId: 11, type: 'lecture' },
    // EC dept (dept 2, program 2)
    { id: 11, code: 'EC101', name: 'Circuit Theory I',                      creditHours: 3, departmentId: 2, programId: 2, type: 'lecture' },
    { id: 12, code: 'EC102', name: 'Circuits Laboratory',                   creditHours: 1, departmentId: 2, programId: 2, type: 'lab' },
    { id: 13, code: 'EC201', name: 'Electromagnetic Theory',                creditHours: 3, departmentId: 2, programId: 2, type: 'lecture' },
    { id: 14, code: 'EC301', name: 'Power Systems Analysis',                creditHours: 3, departmentId: 2, programId: 2, type: 'lecture' },
    { id: 15, code: 'EC302', name: 'Control Systems',                       creditHours: 3, departmentId: 2, programId: 2, type: 'lecture' },
    { id: 16, code: 'EC310', name: 'Digital Communications',                creditHours: 2, departmentId: 2, programId: 2, type: 'lecture' },
    // ME dept (dept 3, program 3)
    { id: 17, code: 'ME101', name: 'Engineering Mechanics',                 creditHours: 3, departmentId: 3, programId: 3, type: 'lecture' },
    { id: 18, code: 'ME201', name: 'Thermodynamics I',                      creditHours: 3, departmentId: 3, programId: 3, type: 'lecture' },
    { id: 19, code: 'ME202', name: 'Thermodynamics Laboratory',             creditHours: 1, departmentId: 3, programId: 3, type: 'lab' },
    { id: 20, code: 'ME301', name: 'Fluid Mechanics',                       creditHours: 3, departmentId: 3, programId: 3, type: 'lecture' },
    { id: 21, code: 'ME302', name: 'Machine Design',                        creditHours: 3, departmentId: 3, programId: 3, type: 'lecture' },
    // CV dept (dept 4, program 4)
    { id: 22, code: 'CV101', name: 'Engineering Surveying',                 creditHours: 3, departmentId: 4, programId: 4, type: 'lecture' },
    { id: 23, code: 'CV201', name: 'Structural Analysis I',                 creditHours: 3, departmentId: 4, programId: 4, type: 'lecture' },
    { id: 24, code: 'CV301', name: 'Geotechnical Engineering',              creditHours: 3, departmentId: 4, programId: 4, type: 'lecture' },
    // BA dept (dept 5, program 5)
    { id: 25, code: 'BA101', name: 'Principles of Management',              creditHours: 3, departmentId: 5, programId: 5, type: 'lecture' },
    { id: 26, code: 'BA201', name: 'Marketing Management',                  creditHours: 3, departmentId: 5, programId: 5, type: 'lecture' },
    { id: 27, code: 'BA301', name: 'Human Resource Management',             creditHours: 3, departmentId: 5, programId: 5, type: 'lecture' },
    { id: 28, code: 'BA302', name: 'Strategic Management',                  creditHours: 2, departmentId: 5, programId: 5, type: 'lecture' },
    // AC dept (dept 6, program 6)
    { id: 29, code: 'AC101', name: 'Financial Accounting I',                creditHours: 3, departmentId: 6, programId: 6, type: 'lecture' },
    { id: 30, code: 'AC201', name: 'Cost Accounting',                       creditHours: 3, departmentId: 6, programId: 6, type: 'lecture' },
    { id: 31, code: 'AC301', name: 'Auditing & Assurance',                  creditHours: 3, departmentId: 6, programId: 6, type: 'lecture' },
    { id: 32, code: 'AC302', name: 'Taxation',                              creditHours: 3, departmentId: 6, programId: 6, type: 'lecture' },
    // ECO dept (dept 7, program 7)
    { id: 33, code: 'ECO101', name: 'Principles of Microeconomics',         creditHours: 3, departmentId: 7, programId: 7, type: 'lecture' },
    { id: 34, code: 'ECO201', name: 'Macroeconomics',                       creditHours: 3, departmentId: 7, programId: 7, type: 'lecture' },
    { id: 35, code: 'ECO301', name: 'Econometrics',                         creditHours: 3, departmentId: 7, programId: 7, type: 'lecture' },
    // MATH dept (dept 8, program 8)
    { id: 36, code: 'MATH101', name: 'Calculus I',                          creditHours: 3, departmentId: 8, programId: 8, type: 'lecture' },
    { id: 37, code: 'MATH201', name: 'Linear Algebra',                      creditHours: 3, departmentId: 8, programId: 8, type: 'lecture' },
    { id: 38, code: 'MATH301', name: 'Probability & Statistics',            creditHours: 3, departmentId: 8, programId: 8, type: 'lecture' },
    // NUR dept (dept 9, program 9)
    { id: 39, code: 'NUR101', name: 'Foundations of Nursing',               creditHours: 3, departmentId: 9, programId: 9, type: 'lecture' },
    { id: 40, code: 'NUR201', name: 'Pathophysiology I',                    creditHours: 3, departmentId: 9, programId: 9, type: 'lecture' },
    // MLS dept (dept 10, program 10)
    { id: 41, code: 'MLS101', name: 'Medical Laboratory Fundamentals',      creditHours: 3, departmentId: 10, programId: 10, type: 'lecture' },
    { id: 42, code: 'MLS201', name: 'Clinical Chemistry',                   creditHours: 3, departmentId: 10, programId: 10, type: 'lecture' },
  ];
  for (const c of courses) {
    await sequelize.query(
      `INSERT INTO "Courses" ("id","code","name","creditHours","departmentId","programId","type","createdAt","updatedAt") VALUES (${c.id},${sqlStr(c.code)},${sqlStr(c.name)},${c.creditHours},${sqlNum(c.departmentId)},${sqlNum(c.programId)},${sqlStr(c.type)},'${now}','${now}')`
    );
  }
  console.log(`Courses seeded (${courses.length})`);

  // ─────────────── COURSE OFFERINGS (Semester 1 + Semester 2) ───────────────
  // Academic level id references are derived from the level array computed above.
  const L = {}; // helper: programId + level -> level id
  for (const l of levels) {
    L[`${l.programId}:${l.level}`] = l.id;
  }
  const lev = (p, lv) => L[`${p}:${lv}`];

  const offerings = [
    // Semester 1
    { id: 1,  courseId: 1,  academicLevelId: lev(1,100), semesterId: 1, lecturerId: lecturerIds[0], numStudents: 130 },
    { id: 2,  courseId: 2,  academicLevelId: lev(1,100), semesterId: 1, lecturerId: lecturerIds[1], numStudents: 130 },
    { id: 3,  courseId: 3,  academicLevelId: lev(1,200), semesterId: 1, lecturerId: lecturerIds[1], numStudents: 95 },
    { id: 4,  courseId: 4,  academicLevelId: lev(1,200), semesterId: 1, lecturerId: lecturerIds[0], numStudents: 90 },
    { id: 5,  courseId: 5,  academicLevelId: lev(1,200), semesterId: 1, lecturerId: lecturerIds[1], numStudents: 90 },
    { id: 6,  courseId: 6,  academicLevelId: lev(1,300), semesterId: 1, lecturerId: lecturerIds[1], numStudents: 80 },
    { id: 7,  courseId: 7,  academicLevelId: lev(1,300), semesterId: 1, lecturerId: lecturerIds[0], numStudents: 75 },
    { id: 8,  courseId: 8,  academicLevelId: lev(1,400), semesterId: 1, lecturerId: lecturerIds[0], numStudents: 60 },
    { id: 9,  courseId: 11, academicLevelId: lev(2,100), semesterId: 1, lecturerId: lecturerIds[2], numStudents: 110 },
    { id: 10, courseId: 12, academicLevelId: lev(2,100), semesterId: 1, lecturerId: lecturerIds[3], numStudents: 110 },
    { id: 11, courseId: 13, academicLevelId: lev(2,200), semesterId: 1, lecturerId: lecturerIds[3], numStudents: 85 },
    { id: 12, courseId: 14, academicLevelId: lev(2,300), semesterId: 1, lecturerId: lecturerIds[2], numStudents: 70 },
    { id: 13, courseId: 15, academicLevelId: lev(2,300), semesterId: 1, lecturerId: lecturerIds[3], numStudents: 65 },
    { id: 14, courseId: 17, academicLevelId: lev(3,100), semesterId: 1, lecturerId: lecturerIds[4], numStudents: 100 },
    { id: 15, courseId: 18, academicLevelId: lev(3,200), semesterId: 1, lecturerId: lecturerIds[4], numStudents: 80 },
    { id: 16, courseId: 20, academicLevelId: lev(3,300), semesterId: 1, lecturerId: lecturerIds[10], numStudents: 65 },
    { id: 17, courseId: 22, academicLevelId: lev(4,100), semesterId: 1, lecturerId: lecturerIds[5], numStudents: 90 },
    { id: 18, courseId: 23, academicLevelId: lev(4,200), semesterId: 1, lecturerId: lecturerIds[11], numStudents: 70 },
    { id: 19, courseId: 25, academicLevelId: lev(5,100), semesterId: 1, lecturerId: lecturerIds[6], numStudents: 130 },
    { id: 20, courseId: 26, academicLevelId: lev(5,200), semesterId: 1, lecturerId: lecturerIds[6], numStudents: 100 },
    { id: 21, courseId: 29, academicLevelId: lev(6,100), semesterId: 1, lecturerId: lecturerIds[7], numStudents: 115 },
    { id: 22, courseId: 30, academicLevelId: lev(6,200), semesterId: 1, lecturerId: lecturerIds[7], numStudents: 90 },
    { id: 23, courseId: 33, academicLevelId: lev(7,100), semesterId: 1, lecturerId: lecturerIds[8], numStudents: 140 },
    { id: 24, courseId: 34, academicLevelId: lev(7,200), semesterId: 1, lecturerId: lecturerIds[12], numStudents: 95 },
    { id: 25, courseId: 36, academicLevelId: lev(8,100), semesterId: 1, lecturerId: lecturerIds[9], numStudents: 120 },
    { id: 26, courseId: 37, academicLevelId: lev(8,200), semesterId: 1, lecturerId: lecturerIds[13], numStudents: 85 },
    { id: 27, courseId: 39, academicLevelId: lev(9,100), semesterId: 1, lecturerId: lecturerIds[5], numStudents: 70 },
    { id: 28, courseId: 41, academicLevelId: lev(10,100), semesterId: 1, lecturerId: lecturerIds[10], numStudents: 55 },
    // Semester 2 (second half of academic year)
    { id: 29, courseId: 9,  academicLevelId: lev(1,400), semesterId: 2, lecturerId: lecturerIds[1], numStudents: 55 },
    { id: 30, courseId: 10, academicLevelId: lev(11,500), semesterId: 2, lecturerId: lecturerIds[0], numStudents: 30 },
    { id: 31, courseId: 16, academicLevelId: lev(2,300), semesterId: 2, lecturerId: lecturerIds[3], numStudents: 60 },
    { id: 32, courseId: 19, academicLevelId: lev(3,200), semesterId: 2, lecturerId: lecturerIds[10], numStudents: 80 },
    { id: 33, courseId: 21, academicLevelId: lev(3,300), semesterId: 2, lecturerId: lecturerIds[4], numStudents: 55 },
    { id: 34, courseId: 24, academicLevelId: lev(4,300), semesterId: 2, lecturerId: lecturerIds[11], numStudents: 60 },
    { id: 35, courseId: 27, academicLevelId: lev(5,300), semesterId: 2, lecturerId: lecturerIds[6], numStudents: 85 },
    { id: 36, courseId: 31, academicLevelId: lev(6,300), semesterId: 2, lecturerId: lecturerIds[7], numStudents: 70 },
    { id: 37, courseId: 35, academicLevelId: lev(7,300), semesterId: 2, lecturerId: lecturerIds[12], numStudents: 60 },
    { id: 38, courseId: 38, academicLevelId: lev(8,300), semesterId: 2, lecturerId: lecturerIds[13], numStudents: 75 },
    { id: 39, courseId: 40, academicLevelId: lev(9,200), semesterId: 2, lecturerId: lecturerIds[5], numStudents: 60 },
    { id: 40, courseId: 42, academicLevelId: lev(10,200), semesterId: 2, lecturerId: lecturerIds[10], numStudents: 50 },
  ];
  for (const o of offerings) {
    await sequelize.query(
      `INSERT INTO "CourseOfferings" ("id","courseId","academicLevelId","semesterId","lecturerId","numStudents","createdAt","updatedAt") VALUES (${o.id},${o.courseId},${o.academicLevelId},${o.semesterId},${sqlNum(o.lecturerId)},${o.numStudents},'${now}','${now}')`
    );
  }
  console.log(`Course Offerings seeded (${offerings.length})`);

  // ─────────────── TIMETABLE SLOTS ───────────────
  // Real class blocks: 8a-10a, 10:30-12:30 (morning break 10-10:30),
  // 1p-3p, 3p-5p, 5p-7p (afternoon break 12:30-1p, tea 3-3? no: 3p-5p then 5p-7p)
  const timeSlots = [
    { start: '08:00', end: '10:00' },
    { start: '10:30', end: '12:30' },
    { start: '13:00', end: '15:00' },
    { start: '15:00', end: '17:00' },
    { start: '17:00', end: '19:00' },
  ];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

  // Classroom pools per department so courses stay in a sensible building
  const depRooms = {
    1: [1, 2, 3, 4, 5, 6],       // CS -> Science Block lecture halls + labs
    2: [7, 8, 9, 10],            // EC -> Engineering Block lectures + lab
    3: [7, 8, 9, 10],            // ME -> Engineering Block
    4: [7, 8, 9],                // CV -> Engineering Block
    5: [11, 12, 13, 14],         // BA -> Business School
    6: [11, 12, 13],             // AC -> Business School
    7: [11, 13, 14],             // ECO -> Business School
    8: [11, 12, 13],             // MATH -> Business School
    9: [18, 19, 20],             // NUR -> Health Sciences
    10: [18, 19, 20],            // MLS -> Health Sciences
  };

  // Track which rooms are already taken per (semester, day, block)
  // so we never schedule two courses in the same hall at the same time.
  // Also track lecturer busy-ness to prevent a lecturer being double-booked.
  const roomBusy = new Map(); // key: `${semesterId}|${day}|${blockIdx}` -> Set of classroomId
  const lecBusy = new Map(); // key: `${semesterId}|${day}|${blockIdx}` -> Set of lecturerId
  const usedKeys = new Map(); // key: `${semesterId}|${day}|${blockIdx}|${roomId}` -> offeringId

  const slots = [];

  for (const o of offerings) {
    const c = courses.find((co) => co.id === o.courseId);
    const isLab = c.type === 'lab';
    const numSessions = isLab ? 1 : 2; // labs once a week, lectures twice
    const pool = depRooms[c.departmentId] || [1, 2, 3];

    for (let s = 0; s < numSessions; s++) {
      let placed = false;
      for (let attempt = 0; attempt < 50 && !placed; attempt++) {
        const day = days[(o.id + s + attempt) % 5];
        const blockIdx = (o.id + s * 2 + attempt) % timeSlots.length;

        const busyKey = `${o.semesterId}|${day}|${blockIdx}`;

        // Check lecturer isn't already teaching at this time
        const lBusy = lecBusy.get(busyKey);
        if (lBusy && lBusy.has(o.lecturerId)) continue;

        // Check room is free
        const busy = roomBusy.get(busyKey);
        const freeRooms = pool.filter((rid) => !busy || !busy.has(rid));
        if (freeRooms.length === 0) continue;

        // choose the room with capacity closest to (>=) numStudents, else largest
        let best = freeRooms[0];
        let bestScore = Infinity;
        for (const rid of freeRooms) {
          const cap = classrooms.find((cr) => cr.id === rid)?.capacity || 0;
          const score = cap >= o.numStudents ? cap - o.numStudents : 100000 + (o.numStudents - cap);
          if (score < bestScore) { bestScore = score; best = rid; }
        }

        const key = `${o.semesterId}|${day}|${blockIdx}|${best}`;
        if (usedKeys.has(key)) continue;

        // Mark all resources as busy
        usedKeys.set(key, o.id);
        if (!roomBusy.has(busyKey)) roomBusy.set(busyKey, new Set());
        roomBusy.get(busyKey).add(best);
        if (!lecBusy.has(busyKey)) lecBusy.set(busyKey, new Set());
        lecBusy.get(busyKey).add(o.lecturerId);

        slots.push({
          offeringId: o.id,
          courseId: o.courseId,
          lecturerId: o.lecturerId,
          classroomId: best,
          day,
          start: timeSlots[blockIdx].start,
          end: timeSlots[blockIdx].end,
          blockIdx,
          semesterId: o.semesterId,
          programId: c.programId,
          academicLevelId: o.academicLevelId,
          timetableLabel: isLab ? 'Lab' : 'Main',
        });
        placed = true;
      }
    }
  }
  for (let i = 0; i < slots.length; i++) {
    const s = slots[i];
    await sequelize.query(
      `INSERT INTO "TimetableSlots" ("id","courseOfferingId","courseId","lecturerId","classroomId","academicYearId","semesterId","programId","academicLevelId","day","startTime","endTime","timetableLabel","createdAt","updatedAt") VALUES (${i + 1},${s.offeringId},${s.courseId},${s.lecturerId},${s.classroomId},1,${s.semesterId},${sqlNum(s.programId)},${s.academicLevelId},${sqlStr(s.day)},'${s.start}','${s.end}',${sqlStr(s.timetableLabel)},'${now}','${now}')`
    );
  }
  console.log(`Timetable Slots seeded (${slots.length})`);

  // ─────────────── LECTURER SCHEDULES (availability) ───────────────
  const schedules = [];
  let sid = 1;
  const availDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  lecturerIds.forEach((lecId, idx) => {
    // Each lecturer is available on a rotating set of days to demonstrate filtering
    const startD = idx % availDays.length;
    for (let d = 0; d < 4; d++) {
      const day = availDays[(startD + d) % availDays.length];
      schedules.push({ id: sid++, lecturerId: lecId, day, startTime: '08:00', endTime: '17:00' });
    }
  });
  for (const sc of schedules) {
    await sequelize.query(
      `INSERT INTO "LecturerSchedules" ("id","lecturerId","day","startTime","endTime","createdAt","updatedAt") VALUES (${sc.id},${sc.lecturerId},${sqlStr(sc.day)},'${sc.startTime}','${sc.endTime}','${now}','${now}')`
    );
  }
  console.log(`Lecturer Schedules seeded (${schedules.length})`);

  // ─────────────── DEMO MESSAGES ───────────────
  const messages = [
    { userId: lecturerIds[0], userName: LECTURERS[0].name, text: 'Hello everyone! Welcome to the new academic year.', room: 'general', isPrivate: false },
    { userId: lecturerIds[1], userName: LECTURERS[1].name, text: 'Hi Dr. Asante! Looking forward to a great year.', room: 'general', isPrivate: false },
    { userId: lecturerIds[2], userName: LECTURERS[2].name, text: 'Quick note: the EC301 lab session needs a projector. Can someone confirm?', room: 'general', isPrivate: false },
    { userId: lecturerIds[0], userName: LECTURERS[0].name, text: `Hi ${LECTURERS[1].name}, do you have the slides for CS201 ready?`, recipientId: lecturerIds[1], recipientName: LECTURERS[1].name, isPrivate: true },
    { userId: lecturerIds[1], userName: LECTURERS[1].name, text: 'Yes, I will share them by Friday.', recipientId: lecturerIds[0], recipientName: LECTURERS[0].name, isPrivate: true },
    { userId: lecturerIds[6], userName: LECTURERS[6].name, text: 'Reminder: BA201 midterm is next week. Please confirm the venue.', room: 'general', isPrivate: false },
    { userId: lecturerIds[3], userName: LECTURERS[3].name, text: 'The control systems lab on Thursday has been moved to EB-F3-LAB01.', room: 'general', isPrivate: false },
    { userId: lecturerIds[7], userName: LECTURERS[7].name, text: 'AC101 needs extra tutorial sessions. Anyone available to assist?', room: 'general', isPrivate: false },
    { userId: lecturerIds[8], userName: LECTURERS[8].name, text: 'Economics tutorial sessions will now hold in the Business School.', room: 'general', isPrivate: false },
    { userId: lecturerIds[9], userName: LECTURERS[9].name, text: 'Maths help desk is open every Wednesday afternoon.', room: 'general', isPrivate: false },
    { userId: lecturerIds[12], userName: LECTURERS[12].name, text: 'Econometrics workshop added for Friday.', room: 'general', isPrivate: false },
    { userId: lecturerIds[5], userName: LECTURERS[5].name, text: 'Civil engineering site visit scheduled for next month.', room: 'general', isPrivate: false },
  ];
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    const ts = new Date(Date.now() - (messages.length - i) * 3600000).toISOString();
    await sequelize.query(
      `INSERT INTO "Messages" ("id","userId","userName","text","recipientId","recipientName","isPrivate","room","createdAt","updatedAt") VALUES (${i + 1},${m.userId},${sqlStr(m.userName)},${sqlStr(m.text)},${sqlNum(m.recipientId || null)},${m.recipientName ? sqlStr(m.recipientName) : 'NULL'},${sqlBool(m.isPrivate)},${sqlStr(m.room)},'${ts}','${ts}')`
    );
  }
  console.log(`Messages seeded (${messages.length})`);

  // ─────────────── GENERATION HISTORY ───────────────
  await sequelize.query(
    `INSERT INTO "GenerationHistories" ("id","semesterId","academicYearId","placedCount","clashCount","totalOfferings","groups","label","status","generatedBy","createdAt","updatedAt") VALUES (1,1,1,${offerings.length},0,${offerings.length},'[]','Demo Generation','success',1,'${now}','${now}')`
  );
  console.log('Generation History seeded');

  // ─────────────── SUMMARY ───────────────
  console.log('\n=== Seed Complete ===');
  console.log('Admin:   admin@lec.com / pass123');
  console.log('Lecturers: (all use password: pass123)');
  for (let i = 0; i < LECTURERS.length; i++) {
    console.log(`  - ${LECTURERS[i].name} (${LECTURERS[i].email})`);
  }
  console.log('');
  console.log(`Faculties: ${faculties.length}`);
  console.log(`Departments: ${departments.length}`);
  console.log(`Programs: ${programs.length}`);
  console.log(`Academic Levels: ${levels.length}`);
  console.log(`Buildings: ${buildings.length}`);
  console.log(`Floors: ${floors.length}`);
  console.log(`Classrooms: ${classrooms.length}`);
  console.log(`Lecturers: ${LECTURERS.length}`);
  console.log(`Courses: ${courses.length}`);
  console.log(`Course Offerings: ${offerings.length}`);
  console.log(`Timetable Slots: ${slots.length}`);
  console.log(`Lecturer Schedules: ${schedules.length}`);
  console.log(`Messages: ${messages.length}`);
  console.log(`Generation History: 1`);
}

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
