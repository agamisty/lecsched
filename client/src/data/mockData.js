export const MOCK_USER = {
  id: 1,
  name: 'Admin User',
  email: 'j.admin@university.edu',
  role: 'admin',
};

export const MOCK_BUILDINGS = [
  { id: 1, name: 'Main Science Building', code: 'MSB', address: '123 University Ave, North Campus', floors: 10, capacity: 1200, status: 'Active', image: 'https://images.unsplash.com/photo-1562774053-701939374585?w=80&h=60&fit=crop' },
  { id: 2, name: 'Engineering Block A', code: 'EBA', address: '45 Tech Park Rd, East Wing', floors: 8, capacity: 950, status: 'Active', image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=80&h=60&fit=crop' },
  { id: 3, name: 'Arts & Humanities Center', code: 'AHC', address: '78 Creative Blvd, West Campus', floors: 6, capacity: 600, status: 'Active', image: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3d?w=80&h=60&fit=crop' },
  { id: 4, name: 'Medical Sciences Hub', code: 'MSH', address: '22 Health Way, South Campus', floors: 12, capacity: 1500, status: 'Maintenance', image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=80&h=60&fit=crop' },
  { id: 5, name: 'Business School Tower', code: 'BST', address: '90 Commerce St, Central Campus', floors: 15, capacity: 2100, status: 'Active', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=80&h=60&fit=crop' },
];

export const MOCK_FLOORS = [
  { id: 1, number: 'Ground Floor', building: 'Main Science Building', classrooms: 12, status: 'Active' },
  { id: 2, number: '1st Floor', building: 'Main Science Building', classrooms: 15, status: 'Active' },
  { id: 3, number: '2nd Floor', building: 'Engineering Block A', classrooms: 10, status: 'Active' },
  { id: 4, number: '3rd Floor', building: 'Engineering Block A', classrooms: 8, status: 'Under Maintenance' },
  { id: 5, number: 'Basement', building: 'Arts & Humanities Center', classrooms: 4, status: 'Closed' },
];

export const MOCK_CLASSROOMS = [
  { id: 1, name: 'LH-105', building: 'Main Science Building', floor: '1st Floor', capacity: 120, type: 'Lecture Hall', status: 'Available' },
  { id: 2, name: 'LAB-204', building: 'Engineering Block A', floor: '2nd Floor', capacity: 40, type: 'Computer Lab', status: 'Available' },
  { id: 3, name: 'SR-301', building: 'Arts & Humanities Center', floor: '3rd Floor', capacity: 25, type: 'Seminar Room', status: 'Available' },
  { id: 4, name: 'LH-102', building: 'Main Science Building', floor: '1st Floor', capacity: 200, type: 'Lecture Hall', status: 'Maintenance' },
  { id: 5, name: 'TR-405', building: 'Business School Tower', floor: '4th Floor', capacity: 35, type: 'Tutorial Room', status: 'Available' },
];

export const MOCK_DEPARTMENTS = [
  { id: 1, name: 'Computer Science', code: 'CS', faculty: 'Faculty of Engineering', programs: 4, hod: 'Prof. Alan Turing', hodEmail: 'alan.turing@university.edu', hodAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=48&h=48&fit=crop&crop=face' },
  { id: 2, name: 'Electrical Engineering', code: 'EE', faculty: 'Faculty of Engineering', programs: 3, hod: 'Dr. Grace Hopper', hodEmail: 'grace.hopper@university.edu', hodAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=48&h=48&fit=crop&crop=face' },
  { id: 3, name: 'Mathematics', code: 'MATH', faculty: 'Faculty of Science', programs: 2, hod: 'Prof. Ada Lovelace', hodEmail: 'ada.lovelace@university.edu', hodAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=48&h=48&fit=crop&crop=face' },
  { id: 4, name: 'Physics', code: 'PHYS', faculty: 'Faculty of Science', programs: 2, hod: 'Dr. Marie Curie', hodEmail: 'marie.curie@university.edu', hodAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=48&h=48&fit=crop&crop=face' },
  { id: 5, name: 'Business Administration', code: 'BUS', faculty: 'School of Management', programs: 5, hod: 'Prof. Warren Buffett', hodEmail: 'w.buffett@university.edu', hodAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=48&h=48&fit=crop&crop=face' },
];

export const MOCK_PROGRAMS = [
  { id: 1, name: 'Computer Science & Engineering', department: 'Faculty of Engineering', duration: '4 Years', type: 'BSc', students: 450 },
  { id: 2, name: 'Information Technology', department: 'Faculty of Engineering', duration: '4 Years', type: 'BSc', students: 320 },
  { id: 3, name: 'Artificial Intelligence', department: 'Faculty of Engineering', duration: '2 Years', type: 'MSc', students: 85 },
  { id: 4, name: 'Business Administration', department: 'School of Management', duration: '3 Years', type: 'BSc', students: 600 },
  { id: 5, name: 'Data Science & Analytics', department: 'Faculty of Engineering', duration: '3 Years', type: 'PhD', students: 24 },
  { id: 6, name: 'Cyber Security', department: 'Faculty of Engineering', duration: '2 Years', type: 'MSc', students: 110 },
];

export const MOCK_LECTURERS = [
  { id: 1, name: 'Dr. Sarah Jenkins', email: 's.jenkins@university.edu', department: 'Computer Science', office: 'Block A, Room 302', status: 'Active', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=48&h=48&fit=crop&crop=face' },
  { id: 2, name: 'Prof. Alan Turing', email: 'alan.turing@university.edu', department: 'Computer Science', office: 'Block B, Room 101', status: 'Active', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=48&h=48&fit=crop&crop=face' },
  { id: 3, name: 'Dr. Grace Hopper', email: 'grace.hopper@university.edu', department: 'Electrical Engineering', office: 'Block C, Room 205', status: 'On Leave', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=48&h=48&fit=crop&crop=face' },
  { id: 4, name: 'Prof. Ada Lovelace', email: 'ada.lovelace@university.edu', department: 'Mathematics', office: 'Block D, Room 410', status: 'Active', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=48&h=48&fit=crop&crop=face' },
  { id: 5, name: 'Dr. Robert Smith', email: 'r.smith@university.edu', department: 'Computer Science', office: 'Block A, Room 201', status: 'Part-time', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=48&h=48&fit=crop&crop=face' },
];

export const MOCK_COURSES = [
  { id: 1, code: 'CS101', title: 'Introduction to Programming', department: 'Computer Science', program: 'BSc Computer Science', credits: 3, status: 'Active' },
  { id: 2, code: 'MAT202', title: 'Linear Algebra', department: 'Mathematics', program: 'BSc Mathematics', credits: 4, status: 'Active' },
  { id: 3, code: 'PHY105', title: 'General Physics I', department: 'Physics', program: 'BSc Physics', credits: 4, status: 'Draft' },
  { id: 4, code: 'BUS301', title: 'Strategic Management', department: 'Business Administration', program: 'BSc Business Admin', credits: 3, status: 'Active' },
  { id: 5, code: 'CS401', title: 'Advanced Algorithms', department: 'Computer Science', program: 'BSc Computer Science', credits: 4, status: 'Active' },
  { id: 6, code: 'EE210', title: 'Circuit Analysis', department: 'Electrical Engineering', program: 'BSc Electrical Eng.', credits: 4, status: 'Archived' },
];

export const MOCK_TIME_SLOTS = [
  { id: 'TS-001', name: 'Morning Block A', start: '08:00 AM', end: '09:00 AM', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], status: 'Active' },
  { id: 'TS-002', name: 'Morning Block B', start: '09:15 AM', end: '10:15 AM', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], status: 'Active' },
  { id: 'TS-003', name: 'Mid-Morning Session', start: '10:30 AM', end: '11:30 AM', days: ['Mon', 'Wed', 'Fri'], status: 'Active' },
  { id: 'TS-004', name: 'Lunch Break', start: '12:00 PM', end: '01:00 PM', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], status: 'Active' },
  { id: 'TS-005', name: 'Afternoon Block A', start: '01:15 PM', end: '02:15 PM', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], status: 'Active' },
  { id: 'TS-006', name: 'Late Afternoon', start: '03:30 PM', end: '04:30 PM', days: ['Tue', 'Thu'], status: 'Active' },
];

export const MOCK_REPORTS = [
  { id: 'REP-001', name: 'Annual Room Utilization Audit', type: 'PDF', date: '2024-10-25', status: 'Ready' },
  { id: 'REP-002', name: 'Faculty Workload Distribution Q3', type: 'Excel', date: '2024-10-24', status: 'Ready' },
  { id: 'REP-003', name: 'Student Schedule Conflict Log', type: 'CSV', date: '2024-10-22', status: 'Failed' },
  { id: 'REP-004', name: 'Infrastructure Maintenance Report', type: 'PDF', date: '2024-10-20', status: 'Ready' },
  { id: 'REP-005', name: 'Departmental Resource Allocation', type: 'Excel', date: '2024-10-18', status: 'Ready' },
];

export const MOCK_GENERATION_HISTORY = [
  { id: 'T-892', score: '98.4%', status: 'Success' },
  { id: 'T-891', score: '82.1%', status: 'Warning' },
  { id: 'T-890', score: '45%', status: 'Failed' },
  { id: 'T-889', score: '96.8%', status: 'Success' },
  { id: 'T-888', score: '94.2%', status: 'Success' },
];

export const MOCK_ACTIVITY = [
  { icon: 'check', title: 'Timetable Generated', detail: 'Semester 1 Engineering schedule completed with 98% efficiency score.', time: '12 MIN AGO' },
  { icon: 'info', title: 'New Lecturer Added', detail: 'Dr. Sarah Jenkins registered to Computer Science department.', time: '45 MIN AGO' },
  { icon: 'alert', title: 'Room Conflict Detected', detail: 'LH-105 double-booked on Tuesday 10:30 AM — auto-resolved.', time: '2 HRS AGO' },
  { icon: 'check', title: 'Course Catalog Updated', detail: '12 new courses added for Fall 2024 semester.', time: '5 HRS AGO' },
  { icon: 'info', title: 'Building Maintenance', detail: 'Medical Sciences Hub marked for maintenance until Nov 15.', time: 'YESTERDAY' },
];

export const MOCK_FACULTIES = ['Faculty of Engineering', 'Faculty of Science', 'School of Management', 'Faculty of Arts', 'Faculty of Medicine'];

export const MOCK_LECTURER_SEARCH = [
  { id: 1, name: 'Prof. Alan Turing', email: 'alan.turing@university.edu', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=48&h=48&fit=crop&crop=face' },
  { id: 2, name: 'Dr. Sarah Jenkins', email: 's.jenkins@university.edu', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=48&h=48&fit=crop&crop=face' },
  { id: 3, name: 'Prof. Ada Lovelace', email: 'ada.lovelace@university.edu', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=48&h=48&fit=crop&crop=face' },
];

export const ROOM_TYPES = ['Lecture Hall', 'Computer Lab', 'Seminar Room', 'Tutorial Room', 'Auditorium'];

export const DEGREE_BADGE = {
  BSc: 'badge-degree-bsc',
  MSc: 'badge-degree-msc',
  PhD: 'badge-degree-phd',
};
