const Building = require('./Building');
const Floor = require('./Floor');
const User = require('./User');
const Faculty = require('./Faculty');
const Department = require('./Department');
const Program = require('./Program');
const AcademicLevel = require('./AcademicLevel');
const AcademicYear = require('./AcademicYear');
const Semester = require('./Semester');
const Course = require('./Course');
const CourseOffering = require('./CourseOffering');
const Classroom = require('./Classroom');
const TimeSlot = require('./TimeSlot');
const TimetableSlot = require('./Timetable');
const LecturerSchedule = require('./LecturerSchedule');
const Message = require('./Message');
const GenerationHistory = require('./GenerationHistory');

// Building -> Floor
Building.hasMany(Floor, { foreignKey: 'buildingId', as: 'buildingFloors' });
Floor.belongsTo(Building, { foreignKey: 'buildingId', as: 'building' });

// Faculty -> Department
Faculty.hasMany(Department, { foreignKey: 'facultyId', as: 'departments' });
Department.belongsTo(Faculty, { foreignKey: 'facultyId', as: 'faculty' });

// Department -> Program
Department.hasMany(Program, { foreignKey: 'departmentId', as: 'programs' });
Program.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });

// Department -> Course
Department.hasMany(Course, { foreignKey: 'departmentId', as: 'courses' });
Course.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });

// Program -> Course
Program.hasMany(Course, { foreignKey: 'programId', as: 'courses' });
Course.belongsTo(Program, { foreignKey: 'programId', as: 'program' });

// Program -> AcademicLevel
Program.hasMany(AcademicLevel, { foreignKey: 'programId', as: 'levels' });
AcademicLevel.belongsTo(Program, { foreignKey: 'programId', as: 'program' });

// AcademicLevel -> CourseOffering
AcademicLevel.hasMany(CourseOffering, { foreignKey: 'academicLevelId', as: 'offerings' });
CourseOffering.belongsTo(AcademicLevel, { foreignKey: 'academicLevelId', as: 'academicLevel' });

// Course -> CourseOffering
Course.hasMany(CourseOffering, { foreignKey: 'courseId', as: 'offerings' });
CourseOffering.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

// Semester -> CourseOffering
Semester.hasMany(CourseOffering, { foreignKey: 'semesterId', as: 'offerings' });
CourseOffering.belongsTo(Semester, { foreignKey: 'semesterId', as: 'semester' });

// User (lecturer) -> CourseOffering
User.hasMany(CourseOffering, { foreignKey: 'lecturerId', as: 'courseOfferings' });
CourseOffering.belongsTo(User, { foreignKey: 'lecturerId', as: 'lecturer' });

// AcademicYear -> Semester
AcademicYear.hasMany(Semester, { foreignKey: 'academicYearId', as: 'semesters' });
Semester.belongsTo(AcademicYear, { foreignKey: 'academicYearId', as: 'academicYear' });

// User (lecturer) -> Course (legacy support)
User.hasMany(Course, { foreignKey: 'lecturerId', as: 'courses' });
Course.belongsTo(User, { foreignKey: 'lecturerId', as: 'lecturer' });

// TimetableSlot relationships
User.hasMany(TimetableSlot, { foreignKey: 'lecturerId' });
TimetableSlot.belongsTo(User, { foreignKey: 'lecturerId' });

Course.hasMany(TimetableSlot, { foreignKey: 'courseId' });
TimetableSlot.belongsTo(Course, { foreignKey: 'courseId' });

Classroom.hasMany(TimetableSlot, { foreignKey: 'classroomId' });
TimetableSlot.belongsTo(Classroom, { foreignKey: 'classroomId' });

CourseOffering.hasMany(TimetableSlot, { foreignKey: 'courseOfferingId' });
TimetableSlot.belongsTo(CourseOffering, { foreignKey: 'courseOfferingId' });

AcademicYear.hasMany(TimetableSlot, { foreignKey: 'academicYearId' });
TimetableSlot.belongsTo(AcademicYear, { foreignKey: 'academicYearId' });

Semester.hasMany(TimetableSlot, { foreignKey: 'semesterId' });
TimetableSlot.belongsTo(Semester, { foreignKey: 'semesterId' });

Program.hasMany(TimetableSlot, { foreignKey: 'programId' });
TimetableSlot.belongsTo(Program, { foreignKey: 'programId' });

AcademicLevel.hasMany(TimetableSlot, { foreignKey: 'academicLevelId' });
TimetableSlot.belongsTo(AcademicLevel, { foreignKey: 'academicLevelId' });

// LecturerSchedule
User.hasMany(LecturerSchedule, { foreignKey: 'lecturerId', as: 'schedule' });
LecturerSchedule.belongsTo(User, { foreignKey: 'lecturerId' });

module.exports = {
  Building, Floor, User, Faculty, Department, Program, AcademicLevel, AcademicYear,
  Semester, Course, CourseOffering, Classroom, TimeSlot,
  TimetableSlot, LecturerSchedule, Message, GenerationHistory
};
