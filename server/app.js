const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

require('./models/associations');

const app = express();

app.use(cors());
app.use(express.json({ limit: '5mb' }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

const { getBooted } = require('./bootstrap');
app.use(async (req, res, next) => {
  try {
    await getBooted();
    next();
  } catch (e) {
    console.error('boot failed', e);
    res.status(500).json({ error: 'boot failed: ' + String(e) });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.get('/api/healthz', async (req, res) => {
  try {
    const sequelize = require('./db');
    const t = ['Programs', 'AcademicLevels', 'Classrooms', 'Courses', 'Users', 'CourseOfferings', 'TimetableSlots', 'LecturerSchedules', 'GenerationHistories'];
    const out = {};
    for (const name of t) {
      const [[r]] = await sequelize.query(`SELECT COUNT(*)::int AS c FROM "${name}"`);
      out[name] = r.c;
    }
    res.json({ counts: out });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/faculties', require('./routes/faculties'));
app.use('/api/departments', require('./routes/departments'));
app.use('/api/buildings', require('./routes/buildings'));
app.use('/api/floors', require('./routes/floors'));
app.use('/api/programs', require('./routes/programs'));
app.use('/api/academic-levels', require('./routes/academicLevels'));
app.use('/api/academic-years', require('./routes/academicYears'));
app.use('/api/semesters', require('./routes/semesters'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/curriculum', require('./routes/curriculum'));
app.use('/api/lecturers', require('./routes/lecturers'));
app.use('/api/classrooms', require('./routes/classrooms'));
app.use('/api/timetable', require('./routes/timetable'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/schedule', require('./routes/schedule'));
app.use('/api/timeslots', require('./routes/timeslots'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/reports', require('./routes/reports'));

// 404 for unknown API routes
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

module.exports = app;
