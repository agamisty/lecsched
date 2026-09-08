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
import ChatPage from './pages/ChatPage';

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="login-page"><p style={{ color: '#fff' }}>Loading...</p></div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AdminOnly({ children }) {
  const { user } = useAuth();
  if (user?.role !== 'admin') return <Navigate to="/viewer" replace />;
  return children;
}

function Home() {
  const { user } = useAuth();
  return user?.role === 'admin' ? <Dashboard /> : <Navigate to="/viewer" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Protected><Home /></Protected>} />
      <Route path="/faculties" element={<Protected><AdminOnly><FacultiesPage /></AdminOnly></Protected>} />
      <Route path="/departments" element={<Protected><AdminOnly><DepartmentsPage /></AdminOnly></Protected>} />
      <Route path="/programs" element={<Protected><AdminOnly><ProgramsPage /></AdminOnly></Protected>} />
      <Route path="/academic-years" element={<Protected><AdminOnly><AcademicYearsPage /></AdminOnly></Protected>} />
      <Route path="/semesters" element={<Protected><AdminOnly><SemestersPage /></AdminOnly></Protected>} />
      <Route path="/courses" element={<Protected><AdminOnly><CoursesPage /></AdminOnly></Protected>} />
      <Route path="/curriculum" element={<Protected><AdminOnly><CurriculumPage /></AdminOnly></Protected>} />
      <Route path="/academic-levels" element={<Protected><AdminOnly><AcademicLevelsPage /></AdminOnly></Protected>} />
      <Route path="/lecturers" element={<Protected><AdminOnly><LecturersPage /></AdminOnly></Protected>} />
      <Route path="/buildings" element={<Protected><AdminOnly><BuildingsPage /></AdminOnly></Protected>} />
      <Route path="/floors" element={<Protected><AdminOnly><FloorsPage /></AdminOnly></Protected>} />
      <Route path="/classrooms" element={<Protected><AdminOnly><ClassroomsPage /></AdminOnly></Protected>} />
      <Route path="/time-slots" element={<Protected><AdminOnly><TimeSlotsPage /></AdminOnly></Protected>} />
      <Route path="/generator" element={<Protected><AdminOnly><GeneratorPage /></AdminOnly></Protected>} />
      <Route path="/viewer" element={<Protected><TimetablePage /></Protected>} />
      <Route path="/reports" element={<Protected><AdminOnly><ReportsPage /></AdminOnly></Protected>} />
      <Route path="/settings" element={<Protected><SettingsPage /></Protected>} />
      <Route path="/chat" element={<Protected><ChatPage /></Protected>} />
      <Route path="*" element={<Navigate to="/viewer" replace />} />
    </Routes>
  );
}
