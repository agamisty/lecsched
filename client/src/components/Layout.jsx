import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Building2,
  GraduationCap,
  Users,
  Building,
  Layers,
  DoorOpen,
  Clock,
  Cpu,
  CalendarDays,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronDown,
  Landmark,
  Calendar,
  BookCopy,
  FileText,
  Layers3,
  Menu,
  MessageCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';
import ChatWidget from './ChatWidget';

const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/chat', label: 'Chat', icon: MessageCircle },
    ]
  },
  {
    label: 'Academic Structure',
    items: [
      { to: '/faculties', label: 'Faculties', icon: Landmark },
      { to: '/departments', label: 'Departments', icon: Building2 },
      { to: '/programs', label: 'Programs', icon: GraduationCap },
      { to: '/academic-years', label: 'Academic Years', icon: Calendar },
      { to: '/semesters', label: 'Semesters', icon: CalendarDays },
      { to: '/courses', label: 'Courses', icon: BookOpen },
      { to: '/academic-levels', label: 'Academic Levels', icon: Layers3 },
      { to: '/curriculum', label: 'Curriculum', icon: BookCopy },
    ]
  },
  {
    label: 'Resources',
    items: [
      { to: '/lecturers', label: 'Lecturers', icon: Users },
      { to: '/buildings', label: 'Buildings', icon: Building },
      { to: '/floors', label: 'Floors', icon: Layers },
      { to: '/classrooms', label: 'Classrooms', icon: DoorOpen },
      { to: '/time-slots', label: 'Time Slots', icon: Clock },
    ]
  },
  {
    label: 'Timetable',
    items: [
      { to: '/generator', label: 'Generator', icon: Cpu },
      { to: '/viewer', label: 'Viewer', icon: CalendarDays },
      { to: '/reports', label: 'Reports', icon: BarChart3 },
    ]
  }
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [openSections, setOpenSections] = useState(() => {
    const initial = {};
    NAV_SECTIONS.forEach((s, i) => { initial[i] = true; });
    return initial;
  });

  const isAdmin = user?.role === 'admin';

  const sections = isAdmin
    ? NAV_SECTIONS
    : [
        {
          label: 'My Timetable',
          items: [
            { to: '/viewer', label: 'My Timetable', icon: CalendarDays },
            { to: '/chat', label: 'Chat with Admin', icon: MessageCircle },
          ]
        }
      ];

  const toggleSection = (idx) => {
    setOpenSections(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeMobileNav = () => setMobileNav(false);

  return (
    <div className={`layout${collapsed ? ' layout-collapsed' : ''}`}>
      <div className="mobile-topbar">
        <button
          type="button"
          className="mobile-menu-btn"
          onClick={() => setMobileNav(true)}
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>
        <span className="mobile-brand">LecSched</span>
      </div>
      {mobileNav && <div className="mobile-nav-overlay" onClick={closeMobileNav} />}
      <aside className={`sidebar sidebar-light${collapsed ? ' sidebar-collapsed' : ''}${mobileNav ? ' mobile-open' : ''}`}>
        <div className="sidebar-brand">
          <Logo />
        </div>
        {!collapsed && user && (
          <div className="sidebar-user">
            <span className="sidebar-user-name">{user.name}</span>
            <span className={`sidebar-role-pill${isAdmin ? ' admin' : ''}`}>{isAdmin ? 'Administrator' : 'Lecturer'}</span>
          </div>
        )}
        <ul className="sidebar-nav sidebar-nav-grouped">
          {sections.map((section, idx) => (
            <li key={idx} className="sidebar-section">
              {!collapsed && (
                <button className="sidebar-section-toggle" onClick={() => toggleSection(idx)}>
                  <span>{section.label}</span>
                  <ChevronDown size={14} className={openSections[idx] ? '' : 'rotated'} />
                </button>
              )}
              {openSections[idx] && section.items.map(({ to, label, icon: Icon, end }) => (
                <NavLink key={to} to={to} end={end} onClick={closeMobileNav} className={({ isActive }) => (isActive ? 'active' : '')}>
                  <Icon size={16} strokeWidth={2} />
                  {!collapsed && <span>{label}</span>}
                </NavLink>
              ))}
            </li>
          ))}
        </ul>
        <div className="sidebar-bottom">
          <NavLink to="/settings" onClick={closeMobileNav} className={({ isActive }) => (isActive ? 'active' : '')}>
            <Settings size={16} />
            {!collapsed && <span>Settings</span>}
          </NavLink>
          <button type="button" className="sidebar-logout" onClick={() => { closeMobileNav(); handleLogout(); }}>
            <LogOut size={16} />
            {!collapsed && <span>Logout</span>}
          </button>
          <button
            type="button"
            className="sidebar-collapse"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <ChevronLeft size={16} className={collapsed ? 'rotated' : ''} />
          </button>
        </div>
      </aside>
      <main className="main-content">{children}</main>
      <ChatWidget />
    </div>
  );
}
