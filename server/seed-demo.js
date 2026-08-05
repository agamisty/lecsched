const sequelize = require('./db');
const bcrypt = require('bcryptjs');
require('./models/associations');
const User = require('./models/User');
const Faculty = require('./models/Faculty');
const Department = require('./models/Department');
const Program = require('./models/Program');
const AcademicLevel = require('./models/AcademicLevel');
const AcademicYear = require('./models/AcademicYear');
const Semester = require('./models/Semester');
const Course = require('./models/Course');
const CourseOffering = require('./models/CourseOffering');
const Classroom = require('./models/Classroom');
const Building = require('./models/Building');
const Floor = require('./models/Floor');
const { ensureDefaultTimeSlots } = require('./scheduler/ensureSlots');
const { generateTimetable } = require('./scheduler/algorithm');

(async () => {
  await sequelize.sync({ force: true });
  console.log('Tables synced (force)');

  // === USERS ===
  const admin = await User.create({ name: 'Dr. Admin', email: 'admin@lec.com', password: await bcrypt.hash('pass123', 10), role: 'admin', department: 'Computer Science', departments: ['Computer Science'] });
  const smith = await User.create({ name: 'Dr. James Smith', email: 'smith@lec.com', password: await bcrypt.hash('pass123', 10), role: 'lecturer', department: 'Computer Science', departments: ['Computer Science'] });
  const jones = await User.create({ name: 'Dr. Sarah Jones', email: 'jones@lec.com', password: await bcrypt.hash('pass123', 10), role: 'lecturer', department: 'Mathematics', departments: ['Mathematics'] });
  const williams = await User.create({ name: 'Prof. Michael Williams', email: 'williams@lec.com', password: await bcrypt.hash('pass123', 10), role: 'lecturer', department: 'Computer Science', departments: ['Computer Science'] });
  const brown = await User.create({ name: 'Dr. Emily Brown', email: 'brown@lec.com', password: await bcrypt.hash('pass123', 10), role: 'lecturer', department: 'Computer Engineering', departments: ['Computer Engineering'] });
  const davis = await User.create({ name: 'Dr. Robert Davis', email: 'davis@lec.com', password: await bcrypt.hash('pass123', 10), role: 'lecturer', department: 'Mathematics', departments: ['Mathematics'] });
  const taylor = await User.create({ name: 'Dr. Lisa Taylor', email: 'taylor@lec.com', password: await bcrypt.hash('pass123', 10), role: 'lecturer', department: 'Physics', departments: ['Physics'] });
  console.log('Users seeded');

  // === FACULTIES ===
  const fpcs = await Faculty.create({ name: 'Faculty of Physical and Computational Sciences', code: 'FPCS', description: 'Covering computing, mathematics, and physical sciences' });
  const feng = await Faculty.create({ name: 'Faculty of Engineering', code: 'FENG', description: 'Engineering and technology disciplines' });
  console.log('Faculties seeded');

  // === DEPARTMENTS ===
  const cs = await Department.create({ name: 'Computer Science', code: 'CS', facultyId: fpcs.id });
  const math = await Department.create({ name: 'Mathematics', code: 'MATH', facultyId: fpcs.id });
  const phys = await Department.create({ name: 'Physics', code: 'PHY', facultyId: fpcs.id });
  const ceng = await Department.create({ name: 'Computer Engineering', code: 'CPE', facultyId: feng.id });
  console.log('Departments seeded');

  // === PROGRAMS ===
  const csBsc = await Program.create({ name: 'BSc Computer Science', code: 'CS-BSC', type: 'BSc', departmentId: cs.id, duration: 4 });
  const itBsc = await Program.create({ name: 'BSc Information Technology', code: 'IT-BSC', type: 'BSc', departmentId: cs.id, duration: 4 });
  const cpeBsc = await Program.create({ name: 'BSc Computer Engineering', code: 'CPE-BSC', type: 'BSc', departmentId: ceng.id, duration: 4 });
  const mathBsc = await Program.create({ name: 'BSc Mathematics', code: 'MTH-BSC', type: 'BSc', departmentId: math.id, duration: 4 });
  console.log('Programs seeded');

  // === ACADEMIC LEVELS ===
  const cs100 = await AcademicLevel.create({ programId: csBsc.id, level: 100, name: 'Level 100' });
  const cs200 = await AcademicLevel.create({ programId: csBsc.id, level: 200, name: 'Level 200' });
  const cs300 = await AcademicLevel.create({ programId: csBsc.id, level: 300, name: 'Level 300' });
  const cs400 = await AcademicLevel.create({ programId: csBsc.id, level: 400, name: 'Level 400' });

  const it100 = await AcademicLevel.create({ programId: itBsc.id, level: 100, name: 'Level 100' });
  const it200 = await AcademicLevel.create({ programId: itBsc.id, level: 200, name: 'Level 200' });
  const it300 = await AcademicLevel.create({ programId: itBsc.id, level: 300, name: 'Level 300' });
  const it400 = await AcademicLevel.create({ programId: itBsc.id, level: 400, name: 'Level 400' });

  const cpe100 = await AcademicLevel.create({ programId: cpeBsc.id, level: 100, name: 'Level 100' });
  const cpe200 = await AcademicLevel.create({ programId: cpeBsc.id, level: 200, name: 'Level 200' });
  const cpe300 = await AcademicLevel.create({ programId: cpeBsc.id, level: 300, name: 'Level 300' });
  const cpe400 = await AcademicLevel.create({ programId: cpeBsc.id, level: 400, name: 'Level 400' });

  const mth100 = await AcademicLevel.create({ programId: mathBsc.id, level: 100, name: 'Level 100' });
  const mth200 = await AcademicLevel.create({ programId: mathBsc.id, level: 200, name: 'Level 200' });
  console.log('Academic levels seeded');

  // === ACADEMIC YEAR & SEMESTERS ===
  const ay2025 = await AcademicYear.create({ name: '2025/2026', startDate: '2025-09-01', endDate: '2026-06-30', isCurrent: true });
  const ay2024 = await AcademicYear.create({ name: '2024/2025', startDate: '2024-09-01', endDate: '2025-06-30', isCurrent: false });
  const sem1 = await Semester.create({ name: 'Semester 1', academicYearId: ay2025.id, isCurrent: true });
  const sem2 = await Semester.create({ name: 'Semester 2', academicYearId: ay2025.id, isCurrent: false });
  const sem1_24 = await Semester.create({ name: 'Semester 1', academicYearId: ay2024.id, isCurrent: false });
  console.log('Academic years and semesters seeded');

  // === BUILDINGS & FLOORS ===
  const bScience = await Building.create({ name: 'Science Hub', code: 'SH', address: 'Main Campus', floors: 3, capacity: 600, status: 'Active' });
  const bEng = await Building.create({ name: 'Engineering Complex', code: 'EC', address: 'Main Campus', floors: 4, capacity: 900, status: 'Active' });
  const bArts = await Building.create({ name: 'Arts Block', code: 'AB', address: 'Main Campus', floors: 2, capacity: 300, status: 'Active' });
  const bBiz = await Building.create({ name: 'Business School', code: 'BS', address: 'Main Campus', floors: 3, capacity: 500, status: 'Active' });

  await Floor.create({ buildingId: bScience.id, name: 'Ground Floor', status: 'Active', description: 'Lecture halls', rooms: 4 });
  await Floor.create({ buildingId: bScience.id, name: '1st Floor', status: 'Active', description: 'Lecture halls and labs', rooms: 6 });
  await Floor.create({ buildingId: bScience.id, name: '2nd Floor', status: 'Active', description: 'Offices and labs', rooms: 5 });
  await Floor.create({ buildingId: bEng.id, name: '1st Floor', status: 'Active', description: 'Engineering labs', rooms: 8 });
  await Floor.create({ buildingId: bEng.id, name: '2nd Floor', status: 'Active', description: 'Lecture halls', rooms: 6 });
  await Floor.create({ buildingId: bArts.id, name: '2nd Floor', status: 'Active', description: 'Seminar rooms', rooms: 4 });
  await Floor.create({ buildingId: bBiz.id, name: 'Ground Floor', status: 'Active', description: 'Large lecture halls', rooms: 3 });
  console.log('Buildings and floors seeded');

  // === COURSES ===
  // CS courses
  const cs101 = await Course.create({ code: 'CS 101', name: 'Introduction to Computer Science', creditHours: 3, departmentId: cs.id, programId: csBsc.id, type: 'lecture' });
  const cs102 = await Course.create({ code: 'CS 102', name: 'Programming I (Python)', creditHours: 3, departmentId: cs.id, programId: csBsc.id, type: 'lecture' });
  const cs102l = await Course.create({ code: 'CS 102L', name: 'Programming I Lab', creditHours: 1, departmentId: cs.id, programId: csBsc.id, type: 'lab' });
  const cs201 = await Course.create({ code: 'CS 201', name: 'Data Structures', creditHours: 3, departmentId: cs.id, programId: csBsc.id, type: 'lecture' });
  const cs202 = await Course.create({ code: 'CS 202', name: 'Object-Oriented Programming', creditHours: 3, departmentId: cs.id, programId: csBsc.id, type: 'lecture' });
  const cs203 = await Course.create({ code: 'CS 203', name: 'Database Systems', creditHours: 3, departmentId: cs.id, programId: csBsc.id, type: 'lecture' });
  const cs301 = await Course.create({ code: 'CS 301', name: 'Algorithms & Complexity', creditHours: 3, departmentId: cs.id, programId: csBsc.id, type: 'lecture' });
  const cs302 = await Course.create({ code: 'CS 302', name: 'Operating Systems', creditHours: 3, departmentId: cs.id, programId: csBsc.id, type: 'lecture' });
  const cs303 = await Course.create({ code: 'CS 303', name: 'Computer Networks', creditHours: 3, departmentId: cs.id, programId: csBsc.id, type: 'lecture' });
  const cs401 = await Course.create({ code: 'CS 401', name: 'Artificial Intelligence', creditHours: 3, departmentId: cs.id, programId: csBsc.id, type: 'lecture' });
  const cs402 = await Course.create({ code: 'CS 402', name: 'Software Engineering', creditHours: 3, departmentId: cs.id, programId: csBsc.id, type: 'lecture' });
  const cs403 = await Course.create({ code: 'CS 403', name: 'Machine Learning', creditHours: 3, departmentId: cs.id, programId: csBsc.id, type: 'lecture' });
  console.log('CS courses seeded');

  // IT courses
  const it101 = await Course.create({ code: 'IT 101', name: 'Introduction to Information Technology', creditHours: 3, departmentId: cs.id, programId: itBsc.id, type: 'lecture' });
  const it102 = await Course.create({ code: 'IT 102', name: 'Web Development I', creditHours: 3, departmentId: cs.id, programId: itBsc.id, type: 'lecture' });
  const it201 = await Course.create({ code: 'IT 201', name: 'Systems Analysis & Design', creditHours: 3, departmentId: cs.id, programId: itBsc.id, type: 'lecture' });
  const it202 = await Course.create({ code: 'IT 202', name: 'Networking Fundamentals', creditHours: 3, departmentId: cs.id, programId: itBsc.id, type: 'lecture' });
  const it301 = await Course.create({ code: 'IT 301', name: 'Cloud Computing', creditHours: 3, departmentId: cs.id, programId: itBsc.id, type: 'lecture' });
  const it401 = await Course.create({ code: 'IT 401', name: 'IT Project Management', creditHours: 3, departmentId: cs.id, programId: itBsc.id, type: 'lecture' });
  console.log('IT courses seeded');

  // CPE courses
  const cpe101 = await Course.create({ code: 'CPE 101', name: 'Engineering Mathematics I', creditHours: 3, departmentId: ceng.id, programId: cpeBsc.id, type: 'lecture' });
  const cpe201 = await Course.create({ code: 'CPE 201', name: 'Digital Logic Design', creditHours: 3, departmentId: ceng.id, programId: cpeBsc.id, type: 'lecture' });
  const cpe301 = await Course.create({ code: 'CPE 301', name: 'Microprocessor Systems', creditHours: 3, departmentId: ceng.id, programId: cpeBsc.id, type: 'lecture' });
  const cpe401 = await Course.create({ code: 'CPE 401', name: 'Embedded Systems', creditHours: 3, departmentId: ceng.id, programId: cpeBsc.id, type: 'lecture' });
  console.log('CPE courses seeded');

  // Math courses
  const mth101 = await Course.create({ code: 'MTH 101', name: 'Calculus I', creditHours: 3, departmentId: math.id, programId: mathBsc.id, type: 'lecture' });
  const mth102 = await Course.create({ code: 'MTH 102', name: 'Linear Algebra', creditHours: 3, departmentId: math.id, programId: mathBsc.id, type: 'lecture' });
  const mth201 = await Course.create({ code: 'MTH 201', name: 'Calculus II', creditHours: 3, departmentId: math.id, programId: mathBsc.id, type: 'lecture' });
  console.log('Math courses seeded');

  // === CLASSROOMS ===
  const r101 = await Classroom.create({ name: 'LH-101', capacity: 120, building: 'Science Hub', floor: 'Ground', type: 'Lecture Hall', status: 'Available' });
  const r102 = await Classroom.create({ name: 'LH-102', capacity: 100, building: 'Science Hub', floor: 'Ground', type: 'Lecture Hall', status: 'Available' });
  const r201 = await Classroom.create({ name: 'LH-201', capacity: 80, building: 'Science Hub', floor: '1st', type: 'Lecture Hall', status: 'Available' });
  const r301 = await Classroom.create({ name: 'LAB-301', capacity: 40, building: 'Engineering Complex', floor: '1st', type: 'Lab', status: 'Available' });
  const r302 = await Classroom.create({ name: 'LAB-302', capacity: 40, building: 'Engineering Complex', floor: '1st', type: 'Lab', status: 'Available' });
  const r401 = await Classroom.create({ name: 'SR-401', capacity: 30, building: 'Arts Block', floor: '2nd', type: 'Seminar Room', status: 'Available' });
  const r501 = await Classroom.create({ name: 'LH-501', capacity: 200, building: 'Business School', floor: 'Ground', type: 'Lecture Hall', status: 'Available' });
  console.log('Classrooms seeded');

  // === TIME SLOTS (block schedule) ===
  await ensureDefaultTimeSlots();
  console.log('Time slots seeded (Block 1-5)');

  // === COURSE OFFERINGS (Semester 1) ===
  // CS Level 100 Sem 1
  await CourseOffering.create({ courseId: cs101.id, academicLevelId: cs100.id, semesterId: sem1.id, numStudents: 120, lecturerId: smith.id });
  await CourseOffering.create({ courseId: cs102.id, academicLevelId: cs100.id, semesterId: sem1.id, numStudents: 120, lecturerId: williams.id });
  await CourseOffering.create({ courseId: cs102l.id, academicLevelId: cs100.id, semesterId: sem1.id, numStudents: 40, lecturerId: williams.id });
  await CourseOffering.create({ courseId: mth101.id, academicLevelId: cs100.id, semesterId: sem1.id, numStudents: 120, lecturerId: jones.id });

  // CS Level 200 Sem 1
  await CourseOffering.create({ courseId: cs201.id, academicLevelId: cs200.id, semesterId: sem1.id, numStudents: 90, lecturerId: smith.id });
  await CourseOffering.create({ courseId: cs202.id, academicLevelId: cs200.id, semesterId: sem1.id, numStudents: 90, lecturerId: williams.id });
  await CourseOffering.create({ courseId: cs203.id, academicLevelId: cs200.id, semesterId: sem1.id, numStudents: 90, lecturerId: brown.id });

  // CS Level 300 Sem 1
  await CourseOffering.create({ courseId: cs301.id, academicLevelId: cs300.id, semesterId: sem1.id, numStudents: 70, lecturerId: smith.id });
  await CourseOffering.create({ courseId: cs302.id, academicLevelId: cs300.id, semesterId: sem1.id, numStudents: 70, lecturerId: williams.id });
  await CourseOffering.create({ courseId: cs303.id, academicLevelId: cs300.id, semesterId: sem1.id, numStudents: 70, lecturerId: brown.id });

  // CS Level 400 Sem 1
  await CourseOffering.create({ courseId: cs401.id, academicLevelId: cs400.id, semesterId: sem1.id, numStudents: 55, lecturerId: smith.id });
  await CourseOffering.create({ courseId: cs402.id, academicLevelId: cs400.id, semesterId: sem1.id, numStudents: 55, lecturerId: williams.id });

  // IT Level 100 Sem 1
  await CourseOffering.create({ courseId: it101.id, academicLevelId: it100.id, semesterId: sem1.id, numStudents: 100, lecturerId: brown.id });
  await CourseOffering.create({ courseId: it102.id, academicLevelId: it100.id, semesterId: sem1.id, numStudents: 100, lecturerId: williams.id });

  // IT Level 200 Sem 1
  await CourseOffering.create({ courseId: it201.id, academicLevelId: it200.id, semesterId: sem1.id, numStudents: 80, lecturerId: brown.id });
  await CourseOffering.create({ courseId: it202.id, academicLevelId: it200.id, semesterId: sem1.id, numStudents: 80, lecturerId: smith.id });

  // IT Level 300 Sem 1
  await CourseOffering.create({ courseId: it301.id, academicLevelId: it300.id, semesterId: sem1.id, numStudents: 60, lecturerId: brown.id });

  // IT Level 400 Sem 1
  await CourseOffering.create({ courseId: it401.id, academicLevelId: it400.id, semesterId: sem1.id, numStudents: 45, lecturerId: williams.id });

  // CPE Level 100 Sem 1
  await CourseOffering.create({ courseId: cpe101.id, academicLevelId: cpe100.id, semesterId: sem1.id, numStudents: 80, lecturerId: jones.id });

  // CPE Level 200 Sem 1
  await CourseOffering.create({ courseId: cpe201.id, academicLevelId: cpe200.id, semesterId: sem1.id, numStudents: 70, lecturerId: brown.id });

  // CPE Level 300 Sem 1
  await CourseOffering.create({ courseId: cpe301.id, academicLevelId: cpe300.id, semesterId: sem1.id, numStudents: 55, lecturerId: brown.id });

  // CPE Level 400 Sem 1
  await CourseOffering.create({ courseId: cpe401.id, academicLevelId: cpe400.id, semesterId: sem1.id, numStudents: 40, lecturerId: brown.id });

  // Math Level 100 Sem 1
  await CourseOffering.create({ courseId: mth101.id, academicLevelId: mth100.id, semesterId: sem1.id, numStudents: 60, lecturerId: jones.id });
  await CourseOffering.create({ courseId: mth102.id, academicLevelId: mth100.id, semesterId: sem1.id, numStudents: 60, lecturerId: davis.id });

  // Math Level 200 Sem 1
  await CourseOffering.create({ courseId: mth201.id, academicLevelId: mth200.id, semesterId: sem1.id, numStudents: 50, lecturerId: jones.id });
  console.log('Course offerings seeded');

  // === TIMETABLE (pre-generate for current semester) ===
  console.log('Generating timetable...');
  const result = await generateTimetable({ semesterId: sem1.id, academicYearId: ay2025.id });
  console.log(`Timetable generated: ${result.placedCount} placed, ${(result.clashes || []).length} clashes`);

  console.log('Demo seed complete!');
  console.log('Login: admin@lec.com / pass123');
  await sequelize.close();
})();
