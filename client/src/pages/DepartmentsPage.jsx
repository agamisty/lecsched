import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import api from '../services/api';
import { facultiesAPI } from '../services/api';
import {
  Search,
  Bell,
  Plus,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  Building2,
  Hash,
  Type,
  Users,
  FileText,
  Check,
  Pencil,
  Trash2,
  MoreHorizontal,
} from 'lucide-react';

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [search, setSearch] = useState('');
  const [filterFaculty, setFilterFaculty] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [hodSearch, setHodSearch] = useState('');
  const [showHodDropdown, setShowHodDropdown] = useState(false);
  const [form, setForm] = useState({
    name: '',
    code: '',
    faculty: '',
    headId: '',
    description: '',
  });
  const perPage = 10;
  const hodRef = useRef(null);

  const load = async () => {
    try {
      const [d, l, f] = await Promise.all([api.get('/departments'), api.get('/lecturers'), facultiesAPI.list()]);
      setDepartments(d.data);
      setLecturers(l.data);
      setFaculties(f.data.faculties || f.data || []);
    } catch {}
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (hodRef.current && !hodRef.current.contains(e.target)) {
        setShowHodDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = departments.filter((d) => {
    if (
      search &&
      !d.name?.toLowerCase().includes(search.toLowerCase()) &&
      !d.code?.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    if (filterFaculty && d.faculty?.name !== filterFaculty) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const visibleRows = filtered.slice((page - 1) * perPage, page * perPage);

  const filteredLecturers = lecturers.filter(
    (l) =>
      !hodSearch ||
      l.name?.toLowerCase().includes(hodSearch.toLowerCase()) ||
      l.email?.toLowerCase().includes(hodSearch.toLowerCase())
  );

  const selectedLecturer = lecturers.find(
    (l) => l.id === Number(form.headId)
  );

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', code: '', facultyId: '', headId: '', description: '' });
    setHodSearch('');
    setShowHodDropdown(false);
    setShowModal(true);
  };

  const openEdit = (d) => {
    setEditing(d);
    setForm({
      name: d.name,
      code: d.code || '',
      facultyId: d.facultyId || d.faculty?.id || '',
      headId: d.headId || '',
      description: d.description || '',
    });
    setHodSearch('');
    setShowHodDropdown(false);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        name: form.name,
        code: form.code,
        facultyId: form.facultyId ? Number(form.facultyId) : null,
        headId: form.headId ? Number(form.headId) : null,
      };
      if (editing) {
        await api.put(`/departments/${editing.id}`, payload);
        toast.success('Department updated successfully');
      } else {
        await api.post('/departments', payload);
        toast.success('Department created successfully');
      }
      setShowModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save department');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this department?')) return;
    try {
      await api.delete(`/departments/${id}`);
      toast.success('Deleted');
      load();
    } catch {}
  };

  return (
    <Layout>
      {/* Topbar */}
      <div className="dash-topbar">
        <div className="dash-search">
          <Search size={15} color="var(--text-light)" />
          <input type="text" placeholder="Search departments..." />
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
        <span className="co-breadcrumb-current">Departments</span>
      </div>

      {/* Header */}
      <div className="co-header">
        <div className="co-header-left">
          <h1 className="co-title">Departments</h1>
          <p className="co-subtitle">Manage academic departments, faculty assignments, and organizational structure.</p>
        </div>
        <div className="co-header-stats">
          <div className="co-stat-chip">
            <span className="co-stat-chip-label">Total Departments</span>
            <span className="co-stat-chip-value">{departments.length}</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="co-filter-bar">
        <div className="co-search-field">
          <Search size={15} color="var(--text-light)" />
          <input type="text" placeholder="Search by name or code..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <div className="co-filter-dept-wrap">
          <select value={filterFaculty} onChange={(e) => { setFilterFaculty(e.target.value); setPage(1); }}>
            <option value="">All Faculties</option>
            {faculties.map((f) => (
              <option key={f.id} value={f.name}>{f.name}</option>
            ))}
          </select>
          <ChevronDown size={14} className="co-select-icon" />
        </div>
        <div className="co-filter-right">
          <button className="btn btn-primary btn-sm" onClick={openCreate}>
            <Plus size={14} />
            Create Department
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="co-table-card">
        <div className="co-table-wrap">
          {/* Header */}
          <div className="dep-table-header">
            <span className="dep-th-name">Department Name</span>
            <span className="dep-th-code">Code</span>
            <span className="dep-th-faculty">Faculty</span>
            <span className="dep-th-hod">Head of Department</span>
            <span className="dep-th-actions">Actions</span>
          </div>
          {/* Rows */}
          {visibleRows.map((d) => (
            <div key={d.id} className="dep-table-row">
              <span className="dep-td-name">
                <div className="dep-td-name-icon">
                  <Building2 size={16} />
                </div>
                {d.name}
              </span>
              <span className="dep-td-code">{d.code}</span>
              <span className="dep-td-faculty">{d.faculty?.name || '—'}</span>
              <span className="dep-td-hod">{d.head?.name || d.headId ? `Lecturer #${d.headId}` : '—'}</span>
              <div className="dep-td-actions">
                <button className="co-action-btn" title="Edit" onClick={() => openEdit(d)}>
                  <Pencil size={14} />
                </button>
                <button className="co-action-btn co-action-danger" title="Delete" onClick={() => handleDelete(d.id)}>
                  <Trash2 size={14} />
                </button>
                <button className="co-action-btn" title="More" onClick={() => setViewing(d)}>
                  <MoreHorizontal size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="co-pagination">
          <span className="co-page-info">
            Showing {((page - 1) * perPage) + 1}–{Math.min(page * perPage, filtered.length)} of {filtered.length} departments
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

      {/* Create Department Modal */}
      {showModal && (
        <div className="dep-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="dep-modal" onClick={(e) => e.stopPropagation()}>
            {/* Close */}
            <button className="dep-modal-close" onClick={() => setShowModal(false)}>
              <X size={18} />
            </button>

            {/* Header */}
            <div className="dep-modal-header">
              <h2>{editing ? 'Edit Department' : 'Create New Department'}</h2>
              <p>{editing ? 'Update the department details and leadership.' : 'Register a new academic department and assign leadership within the university structure.'}</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="dep-modal-form">
              {/* Department Name */}
              <div className="dep-modal-field">
                <label>
                  <Building2 size={13} />
                  Department Name
                </label>
                <input
                  required
                  placeholder="e.g. Department of Physics"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              {/* Faculty + Code */}
              <div className="dep-modal-row-2">
                <div className="dep-modal-field">
                  <label>
                    <Type size={13} />
                    Faculty
                  </label>
                  <div className="dep-modal-select-wrap">
                    <select
                      value={form.facultyId}
                      onChange={(e) => setForm({ ...form, facultyId: e.target.value })}
                    >
                      <option value="">Select faculty</option>
                      {faculties.map((f) => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="dep-modal-select-icon" />
                  </div>
                </div>
                <div className="dep-modal-field">
                  <label>
                    <Hash size={13} />
                    Department Code
                  </label>
                  <input
                    required
                    placeholder="e.g. PHYS"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                  />
                </div>
              </div>

              {/* HOD Dropdown */}
              <div className="dep-modal-field" ref={hodRef} style={{ position: 'relative' }}>
                <label>
                  <Users size={13} />
                  Head of Department (HOD)
                </label>
                <div
                  className="dep-hod-trigger"
                  onClick={() => setShowHodDropdown((v) => !v)}
                >
                  {selectedLecturer ? (
                    <div className="dep-hod-selected">
                      <div className="dep-hod-avatar">{selectedLecturer.name.charAt(0)}</div>
                      <div>
                        <div className="dep-hod-selected-name">{selectedLecturer.name}</div>
                        <div className="dep-hod-selected-email">{selectedLecturer.email}</div>
                      </div>
                      <Check size={16} className="dep-hod-check" />
                    </div>
                  ) : (
                    <div className="dep-hod-placeholder">
                      <Search size={15} />
                      <span>Search lecturers...</span>
                    </div>
                  )}
                </div>
                {showHodDropdown && (
                  <div className="dep-hod-dropdown">
                    <div className="dep-hod-search">
                      <Search size={14} />
                      <input
                        placeholder="Search by name or email..."
                        value={hodSearch}
                        onChange={(e) => setHodSearch(e.target.value)}
                        autoFocus
                      />
                    </div>
                    <div className="dep-hod-options">
                      <div
                        className={`dep-hod-option ${!form.headId ? 'dep-hod-option-active' : ''}`}
                        onClick={() => {
                          setForm({ ...form, headId: '' });
                          setShowHodDropdown(false);
                          setHodSearch('');
                        }}
                      >
                        <div className="dep-hod-avatar dep-hod-avatar-clear">—</div>
                        <div>
                          <div className="dep-hod-option-name">No HOD assigned</div>
                          <div className="dep-hod-option-email">Leave blank</div>
                        </div>
                        {!form.headId && <Check size={16} className="dep-hod-check" />}
                      </div>
                      {filteredLecturers.map((l) => (
                        <div
                          key={l.id}
                          className={`dep-hod-option ${form.headId === String(l.id) ? 'dep-hod-option-active' : ''}`}
                          onClick={() => {
                            setForm({ ...form, headId: String(l.id) });
                            setShowHodDropdown(false);
                            setHodSearch('');
                          }}
                        >
                          <div className="dep-hod-avatar">{l.name.charAt(0)}</div>
                          <div>
                            <div className="dep-hod-option-name">{l.name}</div>
                            <div className="dep-hod-option-email">{l.email}</div>
                          </div>
                          {form.headId === String(l.id) && <Check size={16} className="dep-hod-check" />}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="dep-modal-field">
                <label>
                  <FileText size={13} />
                  Description (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Brief description of the department's focus, goals, or academic scope..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              {/* Actions */}
              <div className="dep-modal-actions">
                <button
                  type="button"
                  className="dep-modal-btn dep-modal-btn-cancel"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="dep-modal-btn dep-modal-btn-submit"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="dep-modal-spinner" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check size={15} />
                      Save Department
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
        <div className="dep-modal-overlay" onClick={() => setViewing(null)}>
          <div className="dep-modal" onClick={(e) => e.stopPropagation()}>
            <button className="dep-modal-close" onClick={() => setViewing(null)}>
              <X size={18} />
            </button>
            <div className="dep-modal-header">
              <h2>{viewing.name}</h2>
              <p>Department details</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem 1rem', padding: '0.5rem 1.5rem 1rem' }}>
              {[
                ['Code', viewing.code || '—'],
                ['Faculty', viewing.faculty?.name || '—'],
                ['Head of Department', viewing.head?.name || viewing.headId ? `Lecturer #${viewing.headId}` : '—'],
                ['Description', viewing.description || '—'],
              ].map(([label, value]) => (
                <div key={label} style={{ fontSize: '0.85rem' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
                  <div style={{ fontWeight: 600, marginTop: '0.15rem' }}>{value}</div>
                </div>
              ))}
            </div>
            <div className="dep-modal-actions">
              <button type="button" className="dep-modal-btn dep-modal-btn-submit" onClick={() => setViewing(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
