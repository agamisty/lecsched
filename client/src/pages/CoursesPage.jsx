import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { coursesAPI, lecturersAPI } from '../services/api';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  Bell,
  Filter,
  Download,
  Plus,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Upload,
  ShieldCheck,
  CalendarClock,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  Check,
  X,
  BookOpen,
  Hash,
  Type,
  Users,
  Building2,
  GraduationCap,
  Clock,
} from 'lucide-react';



const STATUS_CONFIG = {
  Active: { color: '#51cf66', bg: '#e6f9e6' },
  Draft: { color: '#ff922b', bg: '#fff8e6' },
  Archived: { color: '#ff6b6b', bg: '#fff3f3' },
};

export default function CoursesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const importRef = useRef(null);
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(new Set());
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [form, setForm] = useState({
    code: '',
    name: '',
    departmentId: '',
    programId: '',
    lecturerId: '',
    numStudents: '',
    duration: 2,
    year: '',
    semester: '',
    credits: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const perPage = 10;

  const load = async () => {
    try {
      const [c, l, d, p] = await Promise.all([
        coursesAPI.list(),
        lecturersAPI.list(),
        api.get('/departments'),
        api.get('/programs'),
      ]);
      setCourses(c.data);
      setLecturers(l.data);
      setDepartments(d.data);
      setPrograms(p.data);
    } catch {}
  };

  useEffect(() => {
    load();
  }, []);

  const myDepts = user?.departments?.length
    ? user.departments
    : user?.department
    ? [user.department]
    : [];

  const filtered = courses.filter((c) => {
    if (
      search &&
      !c.code?.toLowerCase().includes(search.toLowerCase()) &&
      !c.name?.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    if (filterDept && c.department?.id !== Number(filterDept) && c.departmentId !== Number(filterDept))
      return false;
    if (user?.role !== 'admin' && myDepts.length > 0) {
      const courseDept = c.department?.name || '';
      if (!myDepts.includes(courseDept)) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const visibleRows = filtered.slice((page - 1) * perPage, page * perPage);

  const toggleSelectAll = () => {
    if (selected.size === visibleRows.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(visibleRows.map((r) => r.id)));
    }
  };

  const toggleRow = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const activeCount = courses.length;

  const filteredPrograms = programs.filter(
    (p) => !form.departmentId || p.departmentId === Number(form.departmentId)
  );

  const openCreate = () => {
    const defaultDept = departments.find((d) => myDepts.includes(d.name));
    setEditing(null);
    setForm({
      code: '',
      name: '',
      departmentId: defaultDept?.id || '',
      programId: '',
      credits: '',
      type: 'lecture',
    });
    setShowModal(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm({
      code: c.code,
      name: c.name,
      departmentId: c.departmentId || c.department?.id || '',
      programId: c.programId || c.program?.id || '',
      credits: c.creditHours || '',
      type: c.type || 'lecture',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        code: form.code,
        name: form.name,
        creditHours: form.credits ? Number(form.credits) : 3,
        departmentId: form.departmentId ? Number(form.departmentId) : null,
        programId: form.programId ? Number(form.programId) : null,
        type: form.type || 'lecture',
      };
      if (editing) {
        await coursesAPI.update(editing.id, payload);
        toast.success('Course updated successfully');
      } else {
        await coursesAPI.create(payload);
        toast.success('Course created successfully');
      }
      setShowModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save course');
    } finally {
      setSubmitting(false);
    }
  };

  const exportCoursesCSV = () => {
    const rows = [
      ['Code', 'Title', 'Department', 'Program', 'Credits', 'Type'],
      ...filtered.map((c) => [c.code, c.name, c.department?.name || '', c.program?.name || '', c.creditHours, c.type]),
    ];
    const csv = rows.map((r) => r.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'courses.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Courses exported to CSV');
  };

  const handleCSVImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const lines = String(reader.result || '').split('\n').filter((l) => l.trim());
      let imported = 0;
      for (const line of lines) {
        const parts = line.split(',').map((s) => s.trim().replace(/^"|"$/g, ''));
        const [code, name, credits, type] = parts;
        if (!code || !name) continue;
        try {
          await coursesAPI.create({
            code,
            name,
            creditHours: Number(credits) || 3,
            type: type || 'lecture',
            departmentId: departments[0]?.id || null,
          });
          imported++;
        } catch {}
      }
      if (imported > 0) {
        toast.success(`${imported} course(s) imported`);
        load();
      } else {
        toast.error('No valid rows found. Format: code,name,credits,type');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <Layout>
      {/* Topbar */}
      <div className="dash-topbar">
        <div className="dash-search">
          <Search size={15} color="var(--text-light)" />
          <input type="text" placeholder="Search courses, codes, departments..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
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
        <span className="co-breadcrumb-current">Courses</span>
      </div>

      {/* Header */}
      <div className="co-header">
        <div className="co-header-left">
          <h1 className="co-title">Course Catalog</h1>
          <p className="co-subtitle">Manage academic courses, department assignments, and credit structures.</p>
        </div>
        <div className="co-header-stats">
          <div className="co-stat-chip">
            <span className="co-stat-chip-label">Total Courses</span>
            <span className="co-stat-chip-value">{courses.length}</span>
          </div>
          <div className="co-stat-chip">
            <span className="co-stat-chip-label">Active Programs</span>
            <span className="co-stat-chip-value">{activeCount}</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="co-filter-bar">
        <div className="co-search-field">
          <Search size={15} color="var(--text-light)" />
          <input type="text" placeholder="Search courses..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <div className="co-filter-dept-wrap">
          <select value={filterDept} onChange={(e) => { setFilterDept(e.target.value); setPage(1); }}>
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <ChevronDown size={14} className="co-select-icon" />
        </div>
        <button className="btn btn-ghost btn-sm co-filter-icon-btn" title="Clear filters" onClick={() => { setSearch(''); setFilterDept(''); setPage(1); toast.success('Filters cleared'); }}>
          <Filter size={14} />
        </button>
        <div className="co-filter-right">
          <button className="btn btn-ghost btn-sm" onClick={exportCoursesCSV}>
            <Download size={14} />
            Export
          </button>
          <button className="btn btn-primary btn-sm" onClick={openCreate}>
            <Plus size={14} />
            Create Course
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="co-table-card">
        <div className="co-table-wrap">
          {/* Header */}
          <div className="co-table-header">
            <span className="co-th-check">
              <input type="checkbox" checked={selected.size === visibleRows.length && visibleRows.length > 0} onChange={toggleSelectAll} />
            </span>
            <span className="co-th-code">Course Code</span>
            <span className="co-th-title">Course Title</span>
            <span className="co-th-dept">Department</span>
            <span className="co-th-program">Program</span>
            <span className="co-th-credits">Credits</span>
            <span className="co-th-status">Status</span>
            <span className="co-th-actions">Actions</span>
          </div>
          {/* Rows */}
          {visibleRows.map((c) => {
            return (
              <div key={c.id} className={`co-table-row ${selected.has(c.id) ? 'co-row-selected' : ''}`}>
                <span className="co-td-check">
                  <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleRow(c.id)} />
                </span>
                <span className="co-td-code">{c.code}</span>
                <span className="co-td-title">{c.name}</span>
                <span className="co-td-dept">{c.department?.name || c.dept || '—'}</span>
                <span className="co-td-program">{c.program?.name || c.program || '—'}</span>
                <span className="co-td-credits">{c.creditHours}</span>
                <span className="co-td-status" style={{ color: '#51cf66', background: '#e6f9e6' }}>Active</span>
                <div className="co-td-actions">
                  <button className="co-action-btn" title="View" onClick={() => setViewing(c)}>
                    <Eye size={14} />
                  </button>
                  <button className="co-action-btn" title="Edit" onClick={() => openEdit(c)}>
                    <Pencil size={14} />
                  </button>
                   <button className="co-action-btn co-action-danger" title="Delete" onClick={async () => {
                     if (!window.confirm(`Delete course ${c.code}?`)) return;
                     try {
                       await coursesAPI.delete(c.id);
                       toast.success('Course deleted');
                       load();
                     } catch (err) {
                       toast.error('Failed to delete');
                     }
                   }}>
                    <Trash2 size={14} />
                  </button>
                  <button className="co-action-btn" title="More" onClick={() => setViewing(c)}>
                    <MoreHorizontal size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        <div className="co-pagination">
          <span className="co-page-info">
            Showing {((page - 1) * perPage) + 1}–{Math.min(page * perPage, filtered.length)} of {filtered.length} courses
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

      {/* Bottom Info Cards */}
      <div className="co-info-cards">
        <div className="co-info-card">
          <div className="co-info-icon" style={{ background: '#e8f0fe', color: '#4facfe' }}>
            <Upload size={18} />
          </div>
          <div className="co-info-content">
            <h4>Bulk Upload</h4>
            <p>Import courses from a CSV or Excel file for batch processing.</p>
            <button className="co-info-btn" onClick={() => importRef.current?.click()}>Start Import</button>
            <input ref={importRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleCSVImport} />
          </div>
        </div>
        <div className="co-info-card">
          <div className="co-info-icon" style={{ background: '#fef3e2', color: '#ff922b' }}>
            <ShieldCheck size={18} />
          </div>
          <div className="co-info-content">
            <h4>Constraint Audit</h4>
            <p>Verify course constraints against room capacities and lecturer loads.</p>
            <button className="co-info-btn" onClick={() => navigate('/reports')}>Run Audit</button>
          </div>
        </div>
        <div className="co-info-card">
          <div className="co-info-icon" style={{ background: '#e6f9e6', color: '#51cf66' }}>
            <CalendarClock size={18} />
          </div>
          <div className="co-info-content">
            <h4>Academic Year Info</h4>
            <p>Manage academic years, semesters, and holiday schedules.</p>
            <button className="co-info-btn" onClick={() => navigate('/academic-years')}>Manage Years</button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="dash-footer">
        © 2024 Automated Timetable Generation System · University Administration Portal · v1.0.2
      </div>

      {/* Create Course Modal */}
      {showModal && (
        <div className="co-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="co-modal" onClick={(e) => e.stopPropagation()}>
            {/* Header Banner */}
            <div className="co-modal-banner">
              <div className="co-modal-banner-icon">
                <BookOpen size={22} />
              </div>
              <div>
                <h2 className="co-modal-banner-title">{editing ? 'Edit Course' : 'Add New Course'}</h2>
                <p className="co-modal-banner-sub">{editing ? 'Update the details of this course.' : 'Fill in the details to register a new course into the catalog.'}</p>
              </div>
              <button className="co-modal-close" onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="co-modal-form">
              {/* Row 1: Code + Title */}
              <div className="co-modal-row co-modal-row-2">
                <div className="co-modal-field">
                  <label>
                    <Hash size={13} />
                    Course Code
                  </label>
                  <input
                    required
                    placeholder="e.g. CS401"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                  />
                </div>
                <div className="co-modal-field">
                  <label>
                    <Type size={13} />
                    Course Title
                  </label>
                  <input
                    required
                    placeholder="e.g. Artificial Intelligence"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
              </div>

              {/* Row 2: Department + Program */}
              <div className="co-modal-row co-modal-row-2">
                <div className="co-modal-field">
                  <label>
                    <Building2 size={13} />
                    Department
                  </label>
                  <div className="co-modal-select-wrap">
                    <select
                      value={form.departmentId}
                      onChange={(e) =>
                        setForm({ ...form, departmentId: e.target.value, programId: '' })
                      }
                    >
                      <option value="">Select department</option>
                      {departments
                        .filter((d) => user?.role === 'admin' || myDepts.includes(d.name))
                        .map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                    </select>
                    <ChevronDown size={14} className="co-modal-select-icon" />
                  </div>
                </div>
                <div className="co-modal-field">
                  <label>
                    <GraduationCap size={13} />
                    Program
                  </label>
                  <div className="co-modal-select-wrap">
                    <select
                      value={form.programId}
                      onChange={(e) => setForm({ ...form, programId: e.target.value })}
                    >
                      <option value="">Select program</option>
                      {filteredPrograms.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="co-modal-select-icon" />
                  </div>
                </div>
              </div>

              {/* Row 3: Lecturer + Credits */}
              <div className="co-modal-row co-modal-row-2">
                <div className="co-modal-field">
                  <label>
                    <Users size={13} />
                    Assigned Lecturer
                  </label>
                  <div className="co-modal-select-wrap">
                    <select
                      value={form.lecturerId}
                      onChange={(e) => setForm({ ...form, lecturerId: e.target.value })}
                    >
                      <option value="">Select lecturer</option>
                      {lecturers.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="co-modal-select-icon" />
                  </div>
                </div>
                <div className="co-modal-field">
                  <label>
                    <BookOpen size={13} />
                    Credits
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    placeholder="3"
                    value={form.credits}
                    onChange={(e) => setForm({ ...form, credits: e.target.value })}
                  />
                </div>
              </div>

              {/* Row 4: Students + Duration */}
              <div className="co-modal-row co-modal-row-2">
                <div className="co-modal-field">
                  <label>
                    <Users size={13} />
                    Number of Students
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 45"
                    value={form.numStudents}
                    onChange={(e) => setForm({ ...form, numStudents: e.target.value })}
                  />
                </div>
                <div className="co-modal-field">
                  <label>
                    <Clock size={13} />
                    Duration (hours)
                  </label>
                  <div className="co-modal-select-wrap">
                    <select
                      value={form.duration}
                      onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    >
                      <option value="1">1 hour</option>
                      <option value="2">2 hours</option>
                      <option value="3">3 hours</option>
                    </select>
                    <ChevronDown size={14} className="co-modal-select-icon" />
                  </div>
                </div>
              </div>

              {/* Row 5: Type */}
              <div className="co-modal-row co-modal-row-2">
                <div className="co-modal-field">
                  <label>
                    <CalendarClock size={13} />
                    Course Type
                  </label>
                  <div className="co-modal-select-wrap">
                    <select
                      value={form.type || 'lecture'}
                      onChange={(e) => setForm({ ...form, type: e.target.value })}
                    >
                      <option value="lecture">Lecture</option>
                      <option value="lab">Lab</option>
                      <option value="tutorial">Tutorial</option>
                      <option value="seminar">Seminar</option>
                    </select>
                    <ChevronDown size={14} className="co-modal-select-icon" />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="co-modal-actions">
                <button
                  type="button"
                  className="co-modal-btn co-modal-btn-cancel"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="co-modal-btn co-modal-btn-submit"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="co-modal-spinner" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Plus size={15} />
                      {editing ? 'Update Course' : 'Create Course'}
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
        <div className="co-modal-overlay" onClick={() => setViewing(null)}>
          <div className="co-modal" onClick={(e) => e.stopPropagation()}>
            <div className="co-modal-banner">
              <div className="co-modal-banner-icon">
                <BookOpen size={22} />
              </div>
              <div>
                <h2 className="co-modal-banner-title">{viewing.code}</h2>
                <p className="co-modal-banner-sub">Course details</p>
              </div>
              <button className="co-modal-close" onClick={() => setViewing(null)}>
                <X size={18} />
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem 1rem', padding: '1.25rem 1.5rem' }}>
              {[
                ['Title', viewing.name],
                ['Department', viewing.department?.name || '—'],
                ['Program', viewing.program?.name || '—'],
                ['Credit Hours', viewing.creditHours],
                ['Type', viewing.type],
              ].map(([label, value]) => (
                <div key={label} style={{ fontSize: '0.85rem' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
                  <div style={{ fontWeight: 600, marginTop: '0.15rem' }}>{value}</div>
                </div>
              ))}
            </div>
            <div style={{ padding: '0 1.5rem 1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" className="co-modal-btn co-modal-btn-submit" onClick={() => setViewing(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
