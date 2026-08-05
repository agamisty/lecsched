import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import FacultiesPage from './pages/FacultiesPage';
import DepartmentsPage from './pages/DepartmentsPage';
import ProgramsPage from './pages/ProgramsPage';
import AcademicYearsPage from './pages/AcademicYearsPage';
import SemestersPage from './pages/SemestersPage';
import CoursesPage from './pages/CoursesPage';
import CurriculumPage from './pages/CurriculumPage';
import AcademicLevelsPage from './pages/AcademicLevelsPage';
import LecturersPage from './pages/LecturersPage';
import ClassroomsPage from './pages/ClassroomsPage';
import BuildingsPage from './pages/BuildingsPage';
import FloorsPage from './pages/FloorsPage';
import TimeSlotsPage from './pages/TimeSlotsPage';
import GeneratorPage from './pages/GeneratorPage';
import TimetablePage from './pages/TimetablePage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="login-page"><p style={{ color: '#fff' }}>Loading...</p></div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Protected><Dashboard /></Protected>} />
      <Route path="/faculties" element={<Protected><FacultiesPage /></Protected>} />
      <Route path="/departments" element={<Protected><DepartmentsPage /></Protected>} />
      <Route path="/programs" element={<Protected><ProgramsPage /></Protected>} />
      <Route path="/academic-years" element={<Protected><AcademicYearsPage /></Protected>} />
      <Route path="/semesters" element={<Protected><SemestersPage /></Protected>} />
      <Route path="/courses" element={<Protected><CoursesPage /></Protected>} />
      <Route path="/curriculum" element={<Protected><CurriculumPage /></Protected>} />
      <Route path="/academic-levels" element={<Protected><AcademicLevelsPage /></Protected>} />
      <Route path="/lecturers" element={<Protected><LecturersPage /></Protected>} />
      <Route path="/buildings" element={<Protected><BuildingsPage /></Protected>} />
      <Route path="/floors" element={<Protected><FloorsPage /></Protected>} />
      <Route path="/classrooms" element={<Protected><ClassroomsPage /></Protected>} />
      <Route path="/time-slots" element={<Protected><TimeSlotsPage /></Protected>} />
      <Route path="/generator" element={<Protected><GeneratorPage /></Protected>} />
      <Route path="/viewer" element={<Protected><TimetablePage /></Protected>} />
      <Route path="/reports" element={<Protected><ReportsPage /></Protected>} />
      <Route path="/settings" element={<Protected><SettingsPage /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
