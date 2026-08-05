import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { dashboardAPI } from '../services/api';
import {
  Search,
  Bell,
  Calendar,
  Play,
  BookOpen,
  Users,
  Building2,
  DoorOpen,
  Clock,
  CalendarCheck,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  UserPlus,
  BarChart3,
  Zap,
  FileText,
  Trash2,
  ChevronRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    lecturers: 0,
    courses: 0,
    classrooms: 0,
    slots: 0,
    departments: 0,
    todaySlots: 0,
    successRateData: [],
    distributionData: [],
    activityData: [],
  });

  useEffect(() => {
    api
      .get('/dashboard')
      .then(({ data }) => setStats(data))
      .catch(() => {});
  }, []);

  const clearLogs = async () => {
    if (!confirm('Clear all system activity logs?')) return;
    try {
      await dashboardAPI.clearHistory();
      toast.success('Activity logs cleared');
      setStats((s) => ({ ...s, activityData: [] }));
    } catch {
      toast.error('Failed to clear logs');
    }
  };

  const statCards = [
    {
      icon: BookOpen,
      label: 'Total Courses',
      value: stats.courses || 0,
      change: '+12%',
      up: true,
    },
    {
      icon: Users,
      label: 'Lecturers',
      value: stats.lecturers || 0,
      change: '+8%',
      up: true,
    },
    {
      icon: Building2,
      label: 'Departments',
      value: stats.departments || 0,
      change: '+3%',
      up: true,
    },
    {
      icon: DoorOpen,
      label: 'Total Rooms',
      value: stats.classrooms || 0,
      change: '+5%',
      up: true,
    },
    {
      icon: Clock,
      label: 'Timetables',
      value: stats.slots || 0,
      change: '+15%',
      up: true,
    },
    {
      icon: CalendarCheck,
      label: "Today's Classes",
      value: stats.todaySlots || 0,
      change: '-2%',
      up: false,
    },
  ];

  return (
    <Layout>
      {/* Top Bar */}
      <div className="dash-topbar">
        <div className="dash-search">
          <Search size={16} color="#999" />
          <input placeholder="Search for courses, lecturers, or schedules..." />
        </div>
        <div className="dash-topbar-right">
          <button className="dash-notif-btn">
            <Bell size={20} />
            <span className="dash-notif-dot" />
          </button>
          <div className="dash-divider" />
          <div className="dash-admin">
            <div className="dash-avatar">
              {user?.name?.[0] || 'A'}
            </div>
            <div className="dash-admin-info">
              <span className="dash-admin-name">{user?.name || 'Admin User'}</span>
              <span className="dash-admin-role">University Admin</span>
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Admin Dashboard</h1>
          <p className="dash-subtitle">
            Welcome back, Administrator. Here's what's happening today at Central University.
          </p>
        </div>
        <div className="dash-header-actions">
          <button className="btn btn-ghost" onClick={() => navigate('/timetable')}>
            <Calendar size={16} />
            View Full Calendar
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/generator')}>
            <Play size={16} />
            Run Engine
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="dash-stats-row">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="dash-stat-card">
              <div className="dash-stat-top">
                <div className="dash-stat-icon">
                  <Icon size={20} />
                </div>
                <span className={`dash-stat-badge ${s.up ? 'up' : 'down'}`}>
                  {s.change}
                </span>
              </div>
              <div className="dash-stat-value">{s.value}</div>
              <div className="dash-stat-label">{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* Mid Row: Chart + Activity */}
      <div className="dash-mid-row">
        {/* Generation Success Rate */}
        <div className="dash-card">
          <div className="dash-card-header">
            <div>
              <h3>Generation Success Rate</h3>
              <p className="dash-card-sub">Weekly timetable generation performance</p>
            </div>
            <span className="dash-perf-badge">Optimal Performance</span>
          </div>
          <div className="dash-chart-area">
            {stats.successRateData?.length === 0 ? (
              <div className="dash-empty-state">No generation data yet. Run the scheduler to see performance metrics.</div>
            ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={stats.successRateData || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4facfe" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#4facfe" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 12, fill: '#888' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[60, 100]}
                  tick={{ fontSize: 12, fill: '#888' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: 'none',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
                    fontSize: 13,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="rate"
                  stroke="#4facfe"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorRate)"
                />
              </AreaChart>
            </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* System Activity */}
        <div className="dash-card dash-activity-card">
          <div className="dash-card-header">
            <h3>System Activity</h3>
            <button className="dash-clear-btn" onClick={clearLogs}>
              <Trash2 size={14} />
              Clear Logs
            </button>
          </div>
          <div className="dash-activity-list">
            {(stats.activityData || []).length === 0 ? (
              <div className="dash-empty-state">No activity yet. Activity will appear here as you use the system.</div>
            ) : (stats.activityData || []).map((item, i) => {
              const Icon = item.status === 'success' ? CheckCircle2 : AlertCircle;
              const color = item.status === 'success' ? '#51cf66' : '#ff922b';
              return (
                <div key={i} className="dash-activity-item">
                  <div
                    className="dash-activity-icon"
                    style={{ background: `${color}18`, color }}
                  >
                    <Icon size={14} />
                  </div>
                  <div className="dash-activity-content">
                    <span className="dash-activity-text">{item.text}</span>
                    <span className="dash-activity-detail">{item.detail}</span>
                  </div>
                  <span className="dash-activity-time">{item.time}</span>
                </div>
              );
            })}
          </div>
          <button
            className="btn btn-ghost dash-audit-btn"
            onClick={() => navigate('/reports')}
          >
            View Detailed Audit Trail
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Schedule Distribution */}
      <div className="dash-card dash-dist-card">
        <div className="dash-card-header">
          <h3>Schedule Distribution</h3>
          <p className="dash-card-sub">Classes per department this week</p>
        </div>
        <div className="dash-dist-bars">
          {(stats.distributionData || []).length === 0 ? (
            <div className="dash-empty-state">No distribution data yet. Data will appear after generating timetables.</div>
          ) : (stats.distributionData || []).map((d) => (
            <div key={d.dept} className="dash-dist-row">
              <span className="dash-dist-label">{d.dept}</span>
              <div className="dash-dist-track">
                <div
                  className="dash-dist-fill"
                  style={{ width: `${d.value}%`, background: d.color }}
                />
              </div>
              <span className="dash-dist-value">{d.value}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Operational Shortcuts */}
      <h3 className="dash-section-title">Operational Shortcuts</h3>
      <div className="dash-shortcuts-row">
        <div className="dash-shortcut-card" onClick={() => navigate('/generator')}>
          <div className="dash-shortcut-icon" style={{ background: '#e8f4fd', color: '#4facfe' }}>
            <Zap size={22} />
          </div>
          <h4>Generate New</h4>
          <p>Run timetable generation</p>
        </div>
        <div className="dash-shortcut-card" onClick={() => navigate('/lecturers')}>
          <div className="dash-shortcut-icon" style={{ background: '#e6f9e6', color: '#51cf66' }}>
            <UserPlus size={22} />
          </div>
          <h4>Add Lecturer</h4>
          <p>Register new faculty</p>
        </div>
        <div className="dash-shortcut-card" onClick={() => navigate('/courses')}>
          <div className="dash-shortcut-icon" style={{ background: '#fff3f3', color: '#ff6b6b' }}>
            <BookOpen size={22} />
          </div>
          <h4>Create Course</h4>
          <p>Add new course catalog</p>
        </div>
        <div className="dash-shortcut-card" onClick={() => navigate('/reports')}>
          <div className="dash-shortcut-icon" style={{ background: '#f5f0ff', color: '#9775fa' }}>
            <BarChart3 size={22} />
          </div>
          <h4>System Reports</h4>
          <p>View analytics</p>
        </div>
      </div>

      {/* Footer */}
      <div className="dash-footer">
        © 2024 Automated Timetable Generation System • University Administration Portal • v1.0.2
      </div>
    </Layout>
  );
}
