const sequelize = require('./db');

const TABLES_IN_ORDER = [
  'TimetableSlots',
  'LecturerSchedules',
  'CourseOfferings',
  'GenerationHistories',
  'Messages',
  'Courses',
  'AcademicLevels',
  'Semesters',
  'AcademicYears',
  'Programs',
  'Floors',
  'Classrooms',
  'Departments',
  'Buildings',
  'Faculties'
];

(async () => {
  try {
    for (const table of TABLES_IN_ORDER) {
      await sequelize.query(`DELETE FROM "${table}"`);
      console.log(`Cleared ${table}`);
    }

    await sequelize.query(`DELETE FROM "Users" WHERE "role" = 'lecturer'`);
    console.log('Cleared lecturer users');

    const [[users]] = await sequelize.query(`SELECT COUNT(*)::int AS c FROM "Users"`);
    const [[slots]] = await sequelize.query(`SELECT COUNT(*)::int AS c FROM "TimeSlots"`);
    const [[fac]] = await sequelize.query(`SELECT COUNT(*)::int AS c FROM "Faculties"`);
    const [[dept]] = await sequelize.query(`SELECT COUNT(*)::int AS c FROM "Departments"`);
    const [[prog]] = await sequelize.query(`SELECT COUNT(*)::int AS c FROM "Programs"`);
    const [[courses]] = await sequelize.query(`SELECT COUNT(*)::int AS c FROM "Courses"`);
    const [[tt]] = await sequelize.query(`SELECT COUNT(*)::int AS c FROM "TimetableSlots"`);
    const [[offer]] = await sequelize.query(`SELECT COUNT(*)::int AS c FROM "CourseOfferings"`);

    console.log('---');
    console.log(`Remaining: Users=${users.c}, TimeSlots=${slots.c}, Faculties=${fac.c}, Departments=${dept.c}, Programs=${prog.c}, Courses=${courses.c}, CourseOfferings=${offer.c}, Timetables=${tt.c}`);
    console.log('Demo data cleared. Admin user and default time slots preserved.');
  } catch (err) {
    console.error('Failed to clear demo data:', err.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
})();
