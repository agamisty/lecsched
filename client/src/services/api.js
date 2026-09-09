import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/me', data),
};

export const facultiesAPI = {
  list: () => api.get('/faculties'),
  get: (id) => api.get(`/faculties/${id}`),
  create: (data) => api.post('/faculties', data),
  update: (id, data) => api.put(`/faculties/${id}`, data),
  delete: (id) => api.delete(`/faculties/${id}`),
};

export const departmentsAPI = {
  list: (params) => api.get('/departments', { params }),
  create: (data) => api.post('/departments', data),
  update: (id, data) => api.put(`/departments/${id}`, data),
  delete: (id) => api.delete(`/departments/${id}`),
};

export const buildingsAPI = {
  list: (params) => api.get('/buildings', { params }),
  create: (data) => api.post('/buildings', data),
  update: (id, data) => api.put(`/buildings/${id}`, data),
  delete: (id) => api.delete(`/buildings/${id}`),
};

export const floorsAPI = {
  list: (params) => api.get('/floors', { params }),
  create: (data) => api.post('/floors', data),
  update: (id, data) => api.put(`/floors/${id}`, data),
  delete: (id) => api.delete(`/floors/${id}`),
};

export const programsAPI = {
  list: (params) => api.get('/programs', { params }),
  create: (data) => api.post('/programs', data),
  update: (id, data) => api.put(`/programs/${id}`, data),
  delete: (id) => api.delete(`/programs/${id}`),
};

export const academicLevelsAPI = {
  list: (params) => api.get('/academic-levels', { params }),
  get: (id) => api.get(`/academic-levels/${id}`),
  create: (data) => api.post('/academic-levels', data),
  update: (id, data) => api.put(`/academic-levels/${id}`, data),
  delete: (id) => api.delete(`/academic-levels/${id}`),
};

export const academicYearsAPI = {
  list: () => api.get('/academic-years'),
  current: () => api.get('/academic-years/current'),
  create: (data) => api.post('/academic-years', data),
  update: (id, data) => api.put(`/academic-years/${id}`, data),
  delete: (id) => api.delete(`/academic-years/${id}`),
};

export const semestersAPI = {
  list: (params) => api.get('/semesters', { params }),
  current: () => api.get('/semesters/current'),
  create: (data) => api.post('/semesters', data),
  update: (id, data) => api.put(`/semesters/${id}`, data),
  delete: (id) => api.delete(`/semesters/${id}`),
};

export const coursesAPI = {
  list: (params) => api.get('/courses', { params }),
  create: (data) => api.post('/courses', data),
  update: (id, data) => api.put(`/courses/${id}`, data),
  delete: (id) => api.delete(`/courses/${id}`),
};

export const curriculumAPI = {
  list: (params) => api.get('/curriculum', { params }),
  create: (data) => api.post('/curriculum', data),
  update: (id, data) => api.put(`/curriculum/${id}`, data),
  delete: (id) => api.delete(`/curriculum/${id}`),
};

export const lecturersAPI = {
  list: () => api.get('/lecturers'),
  admins: () => api.get('/lecturers/admins'),
  demoAccounts: () => api.get('/lecturers/demo-accounts'),
  create: (data) => api.post('/lecturers', data),
  update: (id, data) => api.put(`/lecturers/${id}`, data),
  delete: (id) => api.delete(`/lecturers/${id}`),
  myCourses: () => api.get('/lecturers/courses'),
};

export const classroomsAPI = {
  list: (params) => api.get('/classrooms', { params }),
  create: (data) => api.post('/classrooms', data),
  update: (id, data) => api.put(`/classrooms/${id}`, data),
  delete: (id) => api.delete(`/classrooms/${id}`),
};

export const timetableAPI = {
  get: (params) => api.get('/timetable', { params }),
  generate: (config) => api.post('/timetable/generate', config || {}),
  update: (id, data) => api.put(`/timetable/${id}`, data),
  batchMove: (moves) => api.post('/timetable/batch-move', { moves }),
  clear: (params) => api.delete('/timetable/clear', { params }),
  pdf: (params) => api.get('/timetable/pdf', { params, responseType: 'blob' }),
};

export const timeslotsAPI = {
  list: () => api.get('/timeslots'),
  create: (data) => api.post('/timeslots', data),
  update: (id, data) => api.put(`/timeslots/${id}`, data),
  delete: (id) => api.delete(`/timeslots/${id}`),
};

export const messagesAPI = {
  list: (config) => api.get('/messages', config),
  send: (data) => api.post('/messages', data),
  conversations: () => api.get('/messages/conversations'),
  unread: () => api.get('/messages/unread'),
  markRead: (data) => api.post('/messages/read', data),
  heartbeat: () => api.post('/messages/heartbeat'),
  online: () => api.get('/messages/online'),
  edit: (id, data) => api.put(`/messages/${id}`, data),
  remove: (id) => api.delete(`/messages/${id}`),
};

export const scheduleAPI = {
  get: () => api.get('/schedule'),
  update: (slots) => api.put('/schedule', { slots }),
  getByLecturer: (id) => api.get(`/schedule/${id}`),
};

export const reportsAPI = {
  history: () => api.get('/reports/history'),
  stats: () => api.get('/reports/stats'),
};

export const dashboardAPI = {
  get: () => api.get('/dashboard'),
  clearHistory: () => api.delete('/dashboard/history'),
};

export default api;
