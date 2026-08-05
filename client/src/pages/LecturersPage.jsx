import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { lecturersAPI, coursesAPI } from '../services/api';
import api from '../services/api';
import {
  Search,
  Bell,
  Plus,
  Filter,
  Download,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  User,
  Mail,
  Building2,
  Briefcase,
  MapPin,
  Clock,
  Calendar,
  Hash,
  FileText,
  Check,
  Pencil,
  Trash2,
  MoreHorizontal,
  Users,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';



const STATUS_CONFIG = {
  Active: { color: '#51cf66', bg: '#e6f9e6', icon: ShieldCheck },
  'On Leave': { color: '#ff922b', bg: '#fff4e6', icon: AlertCircle },
  'Part-time': { color: '#4facfe', bg: '#e8f4ff', icon: Clock },
};

const EMPLOYMENT_OPTIONS = [
  'Active (Full-time)',
  'Active (Part-time)',
  'On Leave',
  'Contract',
  'Visiting',
];

export default function LecturersPage() {
  const [lecturers, setLecturers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    department: '',
    departments: [],
    position: '',
    employmentStatus: 'Active (Full-time)',
    office: '',
    maxHours: 20,
    contractEnd: '',
    password: 'pass123',
  });
  const perPage = 10;

  const load = async () => {
    try {
      const [l, c, d] = await Promise.all([
        lecturersAPI.list(),
        coursesAPI.list(),
        api.get('/departments'),
      ]);
      setLecturers(l.data);
      setCourses(c.data);
      setDepartments(d.data);
    } catch {}
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = lecturers.filter((l) => {
    if (
      search &&
      !l.name?.toLowerCase().includes(search.toLowerCase()) &&
      !l.email?.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    if (filterDept && l.department !== filterDept && !l.departments?.includes(filterDept)) return false;
    if (filterStatus && l.status !== filterStatus) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const visibleRows = filtered.slice((page - 1) * perPage, page * perPage);

  const getCourseCount = (id) => {
    return courses.filter((c) => c.lecturerId === id).length;
  };

  const totalCount = lecturers.length;
  const activeCount = lecturers.filter((l) => l.status === 'Active' || (!l.status && true)).length;
  const onLeaveCount = lecturers.filter((l) => l.status === 'On Leave').length;
  const partTimeCount = lecturers.filter((l) => l.status === 'Part-time').length;

  const depts = [...new Set(lecturers.map((l) => l.department || (l.departments && l.departments[0])).filter(Boolean))];

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: '',
      email: '',
      department: '',
      departments: [],
      position: '',
      employmentStatus: 'Active (Full-time)',
      office: '',
      maxHours: 20,
      contractEnd: '',
      password: 'pass123',
    });
    setShowModal(true);
  };

  const openEdit = (l) => {
    setEditing(l);
    setForm({
      name: l.name,
      email: l.email,
      department: l.department || (l.departments && l.departments[0]) || '',
      departments: l.departments || [],
      position: l.position || '',
      employmentStatus: l.employmentStatus || l.status || 'Active (Full-time)',
      office: l.office || '',
      maxHours: l.maxHours ?? 20,
      contractEnd: l.contractEnd ? l.contractEnd.slice(0, 10) : '',
      password: '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editing) {
        await lecturersAPI.update(editing.id, form);
        toast.success('Lecturer updated successfully');
      } else {
        await api.post('/lecturers', form);
        toast.success('Lecturer added successfully');
      }
      setShowModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save lecturer');
    } finally {
      setSubmitting(false);
    }
  };

  const exportLecturersCSV = () => {
    const rows = [
      ['Name', 'Email', 'Department', 'Position', 'Status', 'Office', 'Max Hours'],
      ...filtered.map((l) => [l.name, l.email, l.department || (l.departments && l.departments[0]) || '', l.position || '', l.status || l.employmentStatus || 'Active', l.office || '', l.maxHours ?? '']),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lecturers.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Lecturers exported to CSV');
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this lecturer?')) return;
    try {
      await lecturersAPI.delete(id);
      toast.success('Deleted');
      load();
    } catch {}
  };

  const statusBadge = (status) => {
    const s = STATUS_CONFIG[status] || STATUS_CONFIG.Active;
    const Icon = s.icon;
    return (
      <span className="lec-status-badge" style={{ color: s.color, background: s.bg }}>
        <Icon size={11} />
        {status || 'Active'}
      </span>
    );
  };

  return (
    <Layout>
      {/* Topbar */}
      <div className="dash-topbar">
        <div className="dash-search">
          <Search size={15} color="var(--text-light)" />
          <input type="text" placeholder="Search lecturers, emails, departments..." />
        </div>
        <div className="dash-topbar-right">
          <button className="dash-notif-btn">
            <Bell size={18} />
            <span className="dash-notif-dot" />
          </button>
          <div className="dash-divider" />
          <div className="dash-admin">
            <div className="dash-avatar-img" style={{ borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>
              AU
            </div>
            <div className="dash-admin-info">
              <span className="dash-admin-name">Admin User</span>
              <span className="dash-admin-role">University Admin</span>
            </div>
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="co-breadcrumb">
        <a href="#">Dashboard</a>
        <span className="co-breadcrumb-sep">/</span>
        <span className="co-breadcrumb-current">Lecturers</span>
      </div>

      {/* Header */}
      <div className="co-header">
        <div className="co-header-left">
          <h1 className="co-title">Lecturers</h1>
          <p className="co-subtitle">Manage all academic staff members, their roles, and workload assignments.</p>
        </div>
        <div className="co-header-stats">
          <div className="co-stat-chip">
            <span className="co-stat-chip-label">Total Staff</span>
            <span className="co-stat-chip-value">{totalCount}</span>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="lec-stats-row">
        <div className="lec-stat-card">
          <div className="lec-stat-icon lec-stat-icon-blue">
            <Users size={20} />
          </div>
          <div className="lec-stat-info">
            <div className="lec-stat-value">{totalCount}</div>
            <div className="lec-stat-label">Total Lecturers</div>
          </div>
        </div>
        <div className="lec-stat-card">
          <div className="lec-stat-icon lec-stat-icon-green">
            <ShieldCheck size={20} />
          </div>
          <div className="lec-stat-info">
            <div className="lec-stat-value">{activeCount}</div>
            <div className="lec-stat-label">Active</div>
          </div>
        </div>
        <div className="lec-stat-card">
          <div className="lec-stat-icon lec-stat-icon-orange">
            <AlertCircle size={20} />
          </div>
          <div className="lec-stat-info">
            <div className="lec-stat-value">{onLeaveCount}</div>
            <div className="lec-stat-label">On Leave</div>
          </div>
        </div>
        <div className="lec-stat-card">
          <div className="lec-stat-icon lec-stat-icon-cyan">
            <Clock size={20} />
          </div>
          <div className="lec-stat-info">
            <div className="lec-stat-value">{partTimeCount}</div>
            <div className="lec-stat-label">Part-time</div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="co-filter-bar">
        <div className="co-search-field">
          <Search size={15} color="var(--text-light)" />
          <input type="text" placeholder="Search by name or email..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <div className="co-filter-dept-wrap">
          <select value={filterDept} onChange={(e) => { setFilterDept(e.target.value); setPage(1); }}>
            <option value="">All Departments</option>
            {depts.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <ChevronDown size={14} className="co-select-icon" />
        </div>
        <div className="co-filter-dept-wrap">
          <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="On Leave">On Leave</option>
            <option value="Part-time">Part-time</option>
          </select>
          <ChevronDown size={14} className="co-select-icon" />
        </div>
        <div className="co-filter-right">
          <button className="btn btn-ghost btn-sm" onClick={exportLecturersCSV}>
            <Download size={14} />
            Export
          </button>
          <button className="btn btn-primary btn-sm" onClick={openCreate}>
            <Plus size={14} />
            Add Lecturer
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="co-table-card">
        <div className="co-table-wrap">
          <div className="lec-table-header">
            <span className="lec-th-name">Lecturer</span>
            <span className="lec-th-dept">Department</span>
            <span className="lec-th-position">Position</span>
            <span className="lec-th-status">Status</span>
            <span className="lec-th-office">Office</span>
            <span className="lec-th-courses">Courses</span>
            <span className="lec-th-actions">Actions</span>
          </div>
          {visibleRows.map((l) => (
            <div key={l.id} className="lec-table-row">
              <span className="lec-td-name">
                <div className="lec-avatar">{l.name?.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}</div>
                <div className="lec-td-name-info">
                  <div className="lec-td-name-text">{l.name}</div>
                  <div className="lec-td-name-email">{l.email}</div>
                </div>
              </span>
              <span className="lec-td-dept">{l.department || (l.departments && l.departments[0]) || '—'}</span>
              <span className="lec-td-position">{l.position || '—'}</span>
              <span className="lec-td-status">{statusBadge(l.status || 'Active')}</span>
              <span className="lec-td-office">
                <MapPin size={12} />
                {l.office || '—'}
              </span>
              <span className="lec-td-courses">
                <span className="lec-courses-pill">{l.courses ?? getCourseCount(l.id)}</span>
              </span>
              <div className="lec-td-actions">
                <button className="co-action-btn" title="Edit" onClick={() => openEdit(l)}>
                  <Pencil size={14} />
                </button>
                <button className="co-action-btn co-action-danger" title="Delete" onClick={() => handleDelete(l.id)}>
                  <Trash2 size={14} />
                </button>
                <button className="co-action-btn" title="More" onClick={() => setViewing(l)}>
                  <MoreHorizontal size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="co-pagination">
          <span className="co-page-info">
            Showing {((page - 1) * perPage) + 1}–{Math.min(page * perPage, filtered.length)} of {filtered.length} lecturers
          </span>
          <div className="co-page-controls">
            <button className="co-page-btn" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i + 1} className={`co-page-num ${page === i + 1 ? 'active' : ''}`} onClick={() => setPage(i + 1)}>
                {i + 1}
              </button>
            ))}
            <button className="co-page-btn" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="dash-footer">
        © 2024 Automated Timetable Generation System · University Administration Portal · v1.0.2
      </div>

      {/* Create Lecturer Modal */}
      {showModal && (
        <div className="lec-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="lec-modal" onClick={(e) => e.stopPropagation()}>
            {/* Close */}
            <button className="lec-modal-close" onClick={() => setShowModal(false)}>
              <X size={18} />
            </button>

            {/* Header */}
            <div className="lec-modal-header">
              <div className="lec-modal-header-icon">
                <User size={22} />
              </div>
              <div>
                <h2>{editing ? 'Edit Lecturer' : 'Add New Lecturer'}</h2>
                <p>{editing ? 'Update the academic staff member profile.' : 'Create a detailed profile for the new academic staff member'}</p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="lec-modal-form">
              {/* Section 1: Personal Information */}
              <div className="lec-modal-section">
                <h3 className="lec-modal-section-title">
                  <span className="lec-modal-section-dot" />
                  PERSONAL INFORMATION
                </h3>
                <div className="lec-modal-row-2">
                  <div className="lec-modal-field">
                    <label>
                      <User size={13} />
                      Full Name
                    </label>
                    <input
                      required
                      placeholder="e.g. Dr. Sarah Jenkins"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                  </div>
                  <div className="lec-modal-field">
                    <label>
                      <Mail size={13} />
                      University Email
                    </label>
                    <input
                      required
                      type="email"
                      placeholder="name@university.edu"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="lec-modal-divider" />

              {/* Section 2: Academic & Role Details */}
              <div className="lec-modal-section">
                <h3 className="lec-modal-section-title">
                  <span className="lec-modal-section-dot" />
                  ACADEMIC & ROLE DETAILS
                </h3>
                <div className="lec-modal-row-2">
                  <div className="lec-modal-field">
                    <label>
                      <Building2 size={13} />
                      Department
                    </label>
                    <div className="lec-modal-select-wrap">
                      <select
                        value={form.department}
                        onChange={(e) => setForm({ ...form, department: e.target.value })}
                      >
                        <option value="">Select department</option>
                        {departments.map((d) => (
                          <option key={d.id} value={d.name}>{d.name}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="lec-modal-select-icon" />
                    </div>
                  </div>
                  <div className="lec-modal-field">
                    <label>
                      <Briefcase size={13} />
                      Position/Title
                    </label>
                    <input
                      placeholder="e.g. Senior Lecturer"
                      value={form.position}
                      onChange={(e) => setForm({ ...form, position: e.target.value })}
                    />
                  </div>
                </div>
                <div className="lec-modal-row-2">
                  <div className="lec-modal-field">
                    <label>
                      <ShieldCheck size={13} />
                      Employment Status
                    </label>
                    <div className="lec-modal-select-wrap">
                      <select
                        value={form.employmentStatus}
                        onChange={(e) => setForm({ ...form, employmentStatus: e.target.value })}
                      >
                        {EMPLOYMENT_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="lec-modal-select-icon" />
                    </div>
                  </div>
                  <div className="lec-modal-field">
                    <label>
                      <MapPin size={13} />
                      Office Location
                    </label>
                    <input
                      placeholder="e.g. Block A, Room 302"
                      value={form.office}
                      onChange={(e) => setForm({ ...form, office: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="lec-modal-divider" />

              {/* Section 3: Workload & Hours */}
              <div className="lec-modal-section">
                <h3 className="lec-modal-section-title">
                  <span className="lec-modal-section-dot" />
                  WORKLOAD & HOURS
                </h3>
                <div className="lec-modal-row-2">
                  <div className="lec-modal-field">
                    <label>
                      <Clock size={13} />
                      Max Teaching Hours / Week
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="40"
                      value={form.maxHours}
                      onChange={(e) => setForm({ ...form, maxHours: e.target.value })}
                    />
                  </div>
                  <div className="lec-modal-field">
                    <label>
                      <Calendar size={13} />
                      Contract End Date
                    </label>
                    <input
                      type="date"
                      value={form.contractEnd}
                      onChange={(e) => setForm({ ...form, contractEnd: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="lec-modal-actions">
                <button
                  type="button"
                  className="lec-modal-btn lec-modal-btn-cancel"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="lec-modal-btn lec-modal-btn-submit"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="lec-modal-spinner" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check size={15} />
                      Save Lecturer Profile
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {viewing && (
        <div className="lec-modal-overlay" onClick={() => setViewing(null)}>
          <div className="lec-modal" onClick={(e) => e.stopPropagation()}>
            <button className="lec-modal-close" onClick={() => setViewing(null)}>
              <X size={18} />
            </button>
            <div className="lec-modal-header">
              <div className="lec-modal-header-icon">
                <User size={22} />
              </div>
              <div>
                <h2>{viewing.name}</h2>
                <p>{viewing.email} · {viewing.position || '—'}</p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem 1rem', padding: '0.5rem 1.5rem 1rem' }}>
              {[
                ['Department', viewing.department || (viewing.departments && viewing.departments[0]) || '—'],
                ['Status', viewing.status || viewing.employmentStatus || 'Active'],
                ['Office', viewing.office || '—'],
                ['Max Hours/Week', viewing.maxHours ?? '—'],
                ['Contract End', viewing.contractEnd ? viewing.contractEnd.slice(0, 10) : '—'],
              ].map(([label, value]) => (
                <div key={label} style={{ fontSize: '0.85rem' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
                  <div style={{ fontWeight: 600, marginTop: '0.15rem' }}>{value}</div>
                </div>
              ))}
            </div>
            <div className="lec-modal-actions">
              <button type="button" className="lec-modal-btn lec-modal-btn-cancel" onClick={() => setViewing(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
