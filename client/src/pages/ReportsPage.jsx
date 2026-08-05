import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { reportsAPI } from '../services/api';
import {
  Search,
  Bell,
  Filter,
  CalendarClock,
  Building2,
  Users,
  AlertTriangle,
  FileText,
  Download,
  RotateCcw,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Hash,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const reportTemplates = [
  {
    icon: Building2,
    title: 'Room Utilization Audit',
    desc: 'Analyze classroom occupancy rates and identify underused spaces across all campus buildings.',
    color: '#4facfe',
  },
  {
    icon: Users,
    title: 'Faculty Workload Analysis',
    desc: 'Review teaching hours, course loads, and workload distribution across departments.',
    color: '#51cf66',
  },
  {
    icon: AlertTriangle,
    title: 'Student Conflict Log',
    desc: 'Identify scheduling conflicts, overlapping classes, and resolution recommendations.',
    color: '#ff922b',
  },
];

const STATUS_CONFIG = {
  success: { icon: CheckCircle2, color: '#51cf66', bg: '#e6f9e6' },
  failed: { icon: XCircle, color: '#ff6b6b', bg: '#fff3f3' },
};

export default function ReportsPage() {
  const [page, setPage] = useState(1);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const perPage = 5;

  useEffect(() => {
    reportsAPI.history().then((r) => setHistory(r.data || [])).catch(() => {});
    reportsAPI.stats().then((r) => setStats(r.data)).catch(() => {});
  }, []);

  const totalPages = Math.ceil(history.length / perPage);
  const visibleRows = history.slice((page - 1) * perPage, page * perPage);

  const roomUtilization = (stats?.roomUtilization || []).slice(0, 6).map((r) => ({
    building: r.name,
    rate: r.utilization,
  }));

  const overview = stats?.overview || {};

  return (
    <Layout>
      {/* Header */}
      <div className="rp-header">
        <div className="rp-header-left">
          <h1 className="rp-title">System Reports</h1>
          <p className="rp-subtitle">Manage and generate comprehensive academic resource analytics</p>
        </div>
        <div className="rp-header-actions">
          <button className="btn btn-primary btn-sm" onClick={() => toast.success('Schedule auto-report initiated')}>
            <CalendarClock size={14} />
            Schedule Auto-Report
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="rp-template-row" style={{ marginBottom: '1rem' }}>
        <div className="rp-template-card">
          <div className="rp-template-icon" style={{ background: '#4facfe15', color: '#4facfe' }}>
            <Clock size={20} />
          </div>
          <div className="rp-template-info">
            <h4>Scheduled Classes</h4>
            <p style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text)' }}>{overview.totalSlots || 0}</p>
          </div>
        </div>
        <div className="rp-template-card">
          <div className="rp-template-icon" style={{ background: '#51cf6615', color: '#51cf66' }}>
            <Building2 size={20} />
          </div>
          <div className="rp-template-info">
            <h4>Available Rooms</h4>
            <p style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text)' }}>{overview.availableRooms || 0} / {overview.totalClassrooms || 0}</p>
          </div>
        </div>
        <div className="rp-template-card">
          <div className="rp-template-icon" style={{ background: '#ff922b15', color: '#ff922b' }}>
            <Hash size={20} />
          </div>
          <div className="rp-template-info">
            <h4>Course Offerings</h4>
            <p style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text)' }}>{overview.totalOfferings || 0}</p>
          </div>
        </div>
      </div>

      {/* Report Template Cards */}
      <h3 className="rp-section-title">Report Templates</h3>
      <div className="rp-template-row">
        {reportTemplates.map((t) => {
          const Icon = t.icon;
          return (
            <div key={t.title} className="rp-template-card">
              <div className="rp-template-icon" style={{ background: `${t.color}15`, color: t.color }}>
                <Icon size={20} />
              </div>
              <div className="rp-template-info">
                <h4>{t.title}</h4>
                <p>{t.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="rp-charts-row">
        {/* Room Utilization Bar Chart */}
        <div className="rp-card">
          <div className="rp-card-header">
            <h3>Room Utilization</h3>
            <p className="rp-card-sub">By classroom</p>
          </div>
          <div className="rp-chart-area">
            {roomUtilization.length === 0 ? (
              <div className="rp-empty-state" style={{ minHeight: 200 }}>No room data yet. Add classrooms to see utilization.</div>
            ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={roomUtilization} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis
                  dataKey="building"
                  tick={{ fontSize: 10, fill: '#888' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: '#888' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: 'none',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
                    fontSize: 13,
                  }}
                  formatter={(value) => [`${value}%`, 'Utilization']}
                />
                <Bar dataKey="rate" radius={[6, 6, 0, 0]} maxBarSize={36}>
                  {roomUtilization.map((entry, i) => (
                    <Cell key={i} fill={entry.rate >= 70 ? '#4facfe' : entry.rate >= 50 ? '#ff922b' : '#ff6b6b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Generation History Donut */}
        <div className="rp-card rp-donut-card">
          <div className="rp-card-header">
            <h3>Generation History</h3>
            <p className="rp-card-sub">Success vs failures</p>
          </div>
          <div className="rp-donut-area">
            {history.length === 0 ? (
              <div className="rp-empty-state" style={{ minHeight: 200 }}>No generations yet. Run the scheduler first.</div>
            ) : (
            <>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Successful', value: history.filter((h) => h.status === 'success').length, color: '#51cf66' },
                    { name: 'Failed', value: history.filter((h) => h.status === 'failed').length, color: '#ff6b6b' },
                  ].filter((d) => d.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {[
                    { name: 'Successful', value: history.filter((h) => h.status === 'success').length, color: '#51cf66' },
                    { name: 'Failed', value: history.filter((h) => h.status === 'failed').length, color: '#ff6b6b' },
                  ].filter((d) => d.value > 0).map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: 'none',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
                    fontSize: 13,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="rp-donut-center">
              <span className="rp-donut-pct">
                {history.length > 0 ? Math.round((history.filter((h) => h.status === 'success').length / history.length) * 100) : 0}%
              </span>
              <span className="rp-donut-label">Success</span>
            </div>
            </>
            )}
          </div>
          {history.length > 0 && (
          <div className="rp-donut-legend">
            <span className="rp-legend-item">
              <span className="rp-legend-dot" style={{ background: '#51cf66' }} />
              Successful ({history.filter((h) => h.status === 'success').length})
            </span>
            <span className="rp-legend-item">
              <span className="rp-legend-dot" style={{ background: '#ff6b6b' }} />
              Failed ({history.filter((h) => h.status === 'failed').length})
            </span>
          </div>
          )}
        </div>
      </div>

      {/* Generated Reports History */}
      <h3 className="rp-section-title">Generation History</h3>
      <div className="rp-card">
        <div className="rp-table">
          {/* Header */}
          <div className="rp-table-header">
            <span>#</span>
            <span>Label</span>
            <span>Placed</span>
            <span>Clashes</span>
            <span>Total</span>
            <span>Date</span>
            <span>Status</span>
          </div>
          {/* Rows */}
          {visibleRows.length === 0 ? (
            <div className="rp-empty-state">No generations yet. Run the scheduler to see history here.</div>
          ) : visibleRows.map((r, idx) => {
            const sc = STATUS_CONFIG[r.status] || STATUS_CONFIG.failed;
            const StatusIcon = sc.icon;
            return (
              <div key={r.id} className="rp-table-row">
                <span className="rp-row-id">{(page - 1) * perPage + idx + 1}</span>
                <span className="rp-row-name">{r.label || 'Untitled'}</span>
                <span className="rp-row-name">{r.placedCount}</span>
                <span className="rp-row-name">{r.clashCount}</span>
                <span className="rp-row-name">{r.totalOfferings}</span>
                <span className="rp-row-date">{new Date(r.createdAt).toLocaleString()}</span>
                <span className="rp-row-status" style={{ color: sc.color, background: sc.bg }}>
                  <StatusIcon size={12} />
                  {r.status}
                </span>
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        {history.length > perPage && (
        <div className="rp-pagination">
          <span className="rp-page-info">
            Showing {((page - 1) * perPage) + 1}–{Math.min(page * perPage, history.length)} of {history.length} records
          </span>
          <div className="rp-page-controls">
            <button
              className="rp-page-btn"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                className={`rp-page-num ${page === i + 1 ? 'active' : ''}`}
                onClick={() => setPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            <button
              className="rp-page-btn"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
        )}
      </div>

      {/* Footer */}
      <div className="rp-footer">
        Automated Timetable Generation System · University Administration Portal · v1.0.2
      </div>
    </Layout>
  );
}
