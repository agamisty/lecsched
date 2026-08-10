import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
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
  BookOpen,
  GraduationCap,
  Users,
  Clock,
  Pencil,
  Trash2,
  MoreHorizontal,
  Hash,
  Building2,
  FileText,
  Check,
  Layers,
} from 'lucide-react';



const DEGREE_CONFIG = {
  BSc: { color: '#4facfe', bg: '#e8f4ff', label: 'BSc' },
  BA: { color: '#ff922b', bg: '#fff4e6', label: 'BA' },
  MSc: { color: '#51cf66', bg: '#e6f9e6', label: 'MSc' },
  MA: { color: '#cc5de8', bg: '#f3e8ff', label: 'MA' },
  PhD: { color: '#cc5de8', bg: '#f3e8ff', label: 'PhD' },
};

const DEGREE_TYPES = ['BSc', 'BA', 'MSc', 'MA', 'PhD'];

function exportProgramsCSV(programs) {
  const rows = [
    ['Program', 'Code', 'Department', 'Duration', 'Degree Type'],
    ...programs.map((p) => [p.name, p.code || '', p.department?.name || '', p.duration, p.type]),
  ];
  const csv = rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'programs.csv';
  a.click();
  URL.revokeObjectURL(url);
  toast.success('Programs exported to CSV');
}

export default function ProgramsPage() {
  const [programs, setPrograms] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterType, setFilterType] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    code: '',
    departmentId: '',
    type: 'BSc',
    duration: 4,
    description: '',
  });
  const perPage = 10;

  const load = async () => {
    try {
      const [p, d] = await Promise.all([api.get('/programs'), api.get('/departments')]);
      setPrograms(p.data);
      setDepartments(d.data);
    } catch {}
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = programs.filter((p) => {
    if (
      search &&
      !p.name?.toLowerCase().includes(search.toLowerCase()) &&
      !p.code?.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    if (filterDept && p.departmentId !== Number(filterDept) && p.department?.id !== Number(filterDept)) return false;
    if (filterType && p.type !== filterType) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const visibleRows = filtered.slice((page - 1) * perPage, page * perPage);

  const totalCount = programs.length;
  const ugCount = programs.filter((p) => p.type === 'BSc' || p.type === 'BA').length;
  const pgCount = programs.filter((p) => p.type === 'MSc' || p.type === 'MA').length;
  const phdCount = programs.filter((p) => p.type === 'PhD').length;

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', code: '', departmentId: '', type: 'BSc', duration: 4, description: '' });
    setShowModal(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({
      name: p.name,
      code: p.code || '',
      departmentId: p.departmentId || p.department?.id || '',
      type: p.type || 'BSc',
      duration: p.duration || 4,
      description: p.description || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        name: form.name,
        code: form.code,
        departmentId: form.departmentId ? Number(form.departmentId) : null,
        type: form.type,
        duration: Number(form.duration),
      };
      if (editing) {
        await api.put(`/programs/${editing.id}`, payload);
        toast.success('Program updated successfully');
      } else {
        await api.post('/programs', payload);
        toast.success('Program created successfully');
      }
      setShowModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save program');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this program?')) return;
    try {
      await api.delete(`/programs/${id}`);
      toast.success('Deleted');
      load();
    } catch {}
  };

  const degreeBadge = (type) => {
    const c = DEGREE_CONFIG[type] || DEGREE_CONFIG.BSc;
    return (
      <span className="pg-degree-badge" style={{ color: c.color, background: c.bg }}>
        {c.label}
      </span>
    );
  };

  return (
    <Layout>
      {/* Topbar */}
      <div className="dash-topbar">
        <div className="dash-search">
          <Search size={15} color="var(--text-light)" />
          <input type="text" placeholder="Search programs, codes, departments..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
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
        <span className="co-breadcrumb-current">Programs</span>
      </div>

      {/* Header + Actions */}
      <div className="pg-header">
        <div className="pg-header-left">
          <h1 className="co-title">Academic Programs</h1>
          <p className="co-subtitle">Manage and configure degree programs, durations, and department affiliations.</p>
        </div>
        <div className="pg-header-actions">
          <button className="btn btn-ghost btn-sm pg-export-btn" onClick={() => exportProgramsCSV(filtered)}>
            <Download size={14} />
            Export CSV
          </button>
          <button className="btn btn-primary btn-sm" onClick={openCreate}>
            <Plus size={14} />
            Create Program
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="pg-stats-row">
        <div className="pg-stat-card">
          <div className="pg-stat-icon pg-stat-icon-blue">
            <Layers size={20} />
          </div>
          <div className="pg-stat-info">
            <div className="pg-stat-value">{totalCount}</div>
            <div className="pg-stat-label">Total Programs</div>
          </div>
        </div>
        <div className="pg-stat-card">
          <div className="pg-stat-icon pg-stat-icon-cyan">
            <BookOpen size={20} />
          </div>
          <div className="pg-stat-info">
            <div className="pg-stat-value">{ugCount}</div>
            <div className="pg-stat-label">Undergraduate</div>
          </div>
        </div>
        <div className="pg-stat-card">
          <div className="pg-stat-icon pg-stat-icon-green">
            <GraduationCap size={20} />
          </div>
          <div className="pg-stat-info">
            <div className="pg-stat-value">{pgCount}</div>
            <div className="pg-stat-label">Postgraduate</div>
          </div>
        </div>
        <div className="pg-stat-card">
          <div className="pg-stat-icon pg-stat-icon-purple">
            <Users size={20} />
          </div>
          <div className="pg-stat-info">
            <div className="pg-stat-value">{phdCount}</div>
            <div className="pg-stat-label">Research/PhD</div>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="pg-table-card">
        {/* Toolbar */}
        <div className="pg-toolbar">
          <div className="pg-search-field">
            <Search size={15} color="var(--text-light)" />
            <input type="text" placeholder="Search programs..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <button className="pg-filter-btn" title="Clear filters" onClick={() => { setSearch(''); setFilterDept(''); setFilterType(''); setPage(1); toast.success('Filters cleared'); }}>
            <Filter size={14} />
          </button>
          <div className="pg-filter-dept-wrap">
            <select value={filterDept} onChange={(e) => { setFilterDept(e.target.value); setPage(1); }}>
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            <ChevronDown size={14} className="pg-select-icon" />
          </div>
          <div className="pg-filter-dept-wrap">
            <select value={filterType} onChange={(e) => { setFilterType(e.target.value); setPage(1); }}>
              <option value="">All Degrees</option>
              {DEGREE_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <ChevronDown size={14} className="pg-select-icon" />
          </div>
        </div>

        {/* Table */}
        <div className="pg-table-wrap">
          <div className="pg-table-header">
            <span className="pg-th-name">Program Name</span>
            <span className="pg-th-dept">Department</span>
            <span className="pg-th-duration">Duration</span>
            <span className="pg-th-type">Degree Type</span>
            <span className="pg-th-students">Students</span>
            <span className="pg-th-actions">Actions</span>
          </div>
          {visibleRows.map((p) => (
            <div key={p.id} className="pg-table-row">
              <span className="pg-td-name">
                <div className="pg-td-name-icon">
                  <GraduationCap size={16} />
                </div>
                <div>
                  <div className="pg-td-name-text">{p.name}</div>
                  {p.code && <div className="pg-td-name-code">{p.code}</div>}
                </div>
              </span>
              <span className="pg-td-dept">{p.department?.name || p.dept || '—'}</span>
              <span className="pg-td-duration">
                <Clock size={13} />
                {p.duration} {p.duration === 1 ? 'Year' : 'Years'}
              </span>
              <span className="pg-td-type">{degreeBadge(p.type)}</span>
              <span className="pg-td-students">
                <Users size={13} />
                {p.students || '—'}
              </span>
              <div className="pg-td-actions">
                <button className="co-action-btn" title="Edit" onClick={() => openEdit(p)}>
                  <Pencil size={14} />
                </button>
                <button className="co-action-btn co-action-danger" title="Delete" onClick={() => handleDelete(p.id)}>
                  <Trash2 size={14} />
                </button>
                <button className="co-action-btn" title="More" onClick={() => setViewing(p)}>
                  <MoreHorizontal size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="co-pagination">
          <span className="co-page-info">
            Showing {((page - 1) * perPage) + 1}–{Math.min(page * perPage, filtered.length)} of {filtered.length} programs
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

      {/* Create Program Modal */}
      {showModal && (
        <div className="pg-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="pg-modal" onClick={(e) => e.stopPropagation()}>
            <button className="pg-modal-close" onClick={() => setShowModal(false)}>
              <X size={18} />
            </button>

            <div className="pg-modal-header">
              <div className="pg-modal-header-icon">
                <GraduationCap size={22} />
              </div>
              <div>
                <h2>{editing ? 'Edit Program' : 'Create New Program'}</h2>
                <p>{editing ? 'Update the program details.' : 'Register a new degree program and assign it to a department.'}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="pg-modal-form">
              {/* Program Name */}
              <div className="pg-modal-field">
                <label>
                  <BookOpen size={13} />
                  Program Name
                </label>
                <input
                  required
                  placeholder="e.g. B.Sc. Computer Science"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              {/* Code + Department */}
              <div className="pg-modal-row-2">
                <div className="pg-modal-field">
                  <label>
                    <Hash size={13} />
                    Program Code
                  </label>
                  <input
                    required
                    placeholder="e.g. CS-BSC"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                  />
                </div>
                <div className="pg-modal-field">
                  <label>
                    <Building2 size={13} />
                    Department
                  </label>
                  <div className="pg-modal-select-wrap">
                    <select
                      value={form.departmentId}
                      onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                    >
                      <option value="">Select department</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="pg-modal-select-icon" />
                  </div>
                </div>
              </div>

              {/* Type + Duration */}
              <div className="pg-modal-row-2">
                <div className="pg-modal-field">
                  <label>
                    <GraduationCap size={13} />
                    Degree Type
                  </label>
                  <div className="pg-modal-select-wrap">
                    <select
                      value={form.type}
                      onChange={(e) => setForm({ ...form, type: e.target.value })}
                    >
                      {DEGREE_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="pg-modal-select-icon" />
                  </div>
                </div>
                <div className="pg-modal-field">
                  <label>
                    <Clock size={13} />
                    Duration (Years)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  />
                </div>
              </div>

              {/* Description */}
              <div className="pg-modal-field">
                <label>
                  <FileText size={13} />
                  Description (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Brief description of the program's curriculum, goals, or academic scope..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              {/* Actions */}
              <div className="pg-modal-actions">
                <button
                  type="button"
                  className="pg-modal-btn pg-modal-btn-cancel"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="pg-modal-btn pg-modal-btn-submit"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="pg-modal-spinner" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Plus size={15} />
                      {editing ? 'Update Program' : 'Create Program'}
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
        <div className="pg-modal-overlay" onClick={() => setViewing(null)}>
          <div className="pg-modal" onClick={(e) => e.stopPropagation()}>
            <button className="pg-modal-close" onClick={() => setViewing(null)}>
              <X size={18} />
            </button>
            <div className="pg-modal-header">
              <div className="pg-modal-header-icon">
                <GraduationCap size={22} />
              </div>
              <div>
                <h2>{viewing.name}</h2>
                <p>Program details</p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem 1rem', padding: '0.5rem 1.5rem 1rem' }}>
              {[
                ['Code', viewing.code || '—'],
                ['Department', viewing.department?.name || '—'],
                ['Degree Type', viewing.type],
                ['Duration', `${viewing.duration} year(s)`],
                ['Description', viewing.description || '—'],
              ].map(([label, value]) => (
                <div key={label} style={{ fontSize: '0.85rem' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
                  <div style={{ fontWeight: 600, marginTop: '0.15rem' }}>{value}</div>
                </div>
              ))}
            </div>
            <div className="pg-modal-actions">
              <button type="button" className="pg-modal-btn pg-modal-btn-cancel" onClick={() => setViewing(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
