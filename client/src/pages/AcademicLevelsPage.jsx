import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { programsAPI, academicLevelsAPI } from '../services/api';
import {
  Search,
  Bell,
  Plus,
  ChevronDown,
  X,
  GraduationCap,
  Sparkles,
  Pencil,
  Trash2,
  MoreHorizontal,
  BookCopy,
  Users,
  Layers3,
  Info,
} from 'lucide-react';

export default function AcademicLevelsPage() {
  const [programs, setPrograms] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState('');
  const [levels, setLevels] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ level: '', name: '' });

  const loadPrograms = async () => {
    try {
      const res = await programsAPI.list();
      setPrograms(res.data);
    } catch {}
  };

  const loadLevels = async (progId) => {
    if (!progId) { setLevels([]); return; }
    try {
      const res = await academicLevelsAPI.list({ programId: progId });
      setLevels(res.data);
    } catch {}
  };

  useEffect(() => { loadPrograms(); }, []);

  useEffect(() => {
    if (selectedProgram) loadLevels(selectedProgram);
    else setLevels([]);
  }, [selectedProgram]);

  const programObj = programs.find((p) => String(p.id) === String(selectedProgram));
  const duration = Number(programObj?.duration) || 0;

  const totalOfferings = levels.reduce((s, l) => s + (l.offerings?.length || 0), 0);

  const autoGenerate = async () => {
    if (!programObj) return;
    if (!duration) { toast.error('This programme has no duration set. Edit the programme first.'); return; }
    const existing = new Set(levels.map((l) => Number(l.level)));
    const missing = [];
    for (let n = 1; n <= duration; n++) if (!existing.has(n)) missing.push(n);
    if (missing.length === 0) { toast.success('All years already exist for this programme'); return; }
    setGenerating(true);
    let created = 0;
    for (const n of missing) {
      try { await academicLevelsAPI.create({ programId: selectedProgram, level: n, name: `Year ${n}` }); created++; } catch {}
    }
    toast.success(`${created} year(s) generated for ${programObj.name}`);
    loadLevels(selectedProgram);
    setGenerating(false);
  };

  const openCreate = () => {
    setEditing(null);
    const next = levels.length + 1;
    setForm({ level: duration >= next ? String(next) : '', name: '' });
    setShowModal(true);
  };

  const openEdit = (l) => {
    setEditing(l);
    setForm({ level: l.level, name: l.name });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        programId: Number(selectedProgram),
        level: Number(form.level),
        name: form.name || `Year ${form.level}`,
      };
      if (editing) {
        await academicLevelsAPI.update(editing.id, payload);
        toast.success('Year updated successfully');
      } else {
        await academicLevelsAPI.create(payload);
        toast.success('Year added successfully');
      }
      setShowModal(false);
      loadLevels(selectedProgram);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save year');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (l) => {
    if (!confirm(`Delete ${l.name}?`)) return;
    try {
      await academicLevelsAPI.delete(l.id);
      toast.success('Year deleted');
      loadLevels(selectedProgram);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Cannot delete year with course offerings');
    }
  };

  return (
    <Layout>
      <div className="dash-topbar">
        <div className="dash-search">
          <Search size={15} color="var(--text-light)" />
          <input type="text" placeholder="Search academic levels..." />
        </div>
        <div className="dash-topbar-right">
          <button className="dash-notif-btn">
            <Bell size={18} />
            <span className="dash-notif-dot" />
          </button>
          <div className="dash-divider" />
          <div className="dash-admin">
            <div className="dash-avatar-img" style={{ borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>AU</div>
            <div className="dash-admin-info">
              <span className="dash-admin-name">Admin User</span>
              <span className="dash-admin-role">University Admin</span>
            </div>
          </div>
        </div>
      </div>

      <div className="co-breadcrumb">
        <a href="#">Dashboard</a>
        <span className="co-breadcrumb-sep">/</span>
        <span className="co-breadcrumb-current">Academic Levels</span>
      </div>

      <div className="co-header">
        <div className="co-header-left">
          <h1 className="co-title">Academic Levels (Years)</h1>
          <p className="co-subtitle">Select a programme and define the years (Year 1, 2, 3, ...) that its information belongs to.</p>
        </div>
        <div className="co-header-stats">
          <div className="co-stat-chip">
            <span className="co-stat-chip-label">Selected Programme</span>
            <span className="co-stat-chip-value">{programObj ? `${programObj.name} · ${duration} yr(s)` : '—'}</span>
          </div>
        </div>
      </div>

      <div className="lec-stats-row">
        <div className="lec-stat-card">
          <div className="lec-stat-icon lec-stat-icon-blue"><Layers3 size={20} /></div>
          <div className="lec-stat-info">
            <div className="lec-stat-value">{levels.length}</div>
            <div className="lec-stat-label">Total Years</div>
          </div>
        </div>
        <div className="lec-stat-card">
          <div className="lec-stat-icon lec-stat-icon-green"><BookCopy size={20} /></div>
          <div className="lec-stat-info">
            <div className="lec-stat-value">{totalOfferings}</div>
            <div className="lec-stat-label">Course Offerings</div>
          </div>
        </div>
        <div className="lec-stat-card">
          <div className="lec-stat-icon lec-stat-icon-cyan"><GraduationCap size={20} /></div>
          <div className="lec-stat-info">
            <div className="lec-stat-value">{programObj ? duration : 0}</div>
            <div className="lec-stat-label">Programme Duration</div>
          </div>
        </div>
      </div>

      <div className="co-filter-bar">
        <div className="co-filter-dept-wrap" style={{ minWidth: '320px' }}>
          <select value={selectedProgram} onChange={(e) => setSelectedProgram(e.target.value)}>
            <option value="">Select programme...</option>
            {programs.map((p) => (
              <option key={p.id} value={p.id}>{p.name} ({p.code}) · {p.duration} yr(s)</option>
            ))}
          </select>
          <ChevronDown size={14} className="co-select-icon" />
        </div>
        <div className="co-filter-right">
          {programObj && (
            <button className="btn btn-ghost btn-sm" onClick={autoGenerate} disabled={generating}>
              <Sparkles size={14} />
              {generating ? 'Generating...' : `Auto-Generate Year 1–${duration}`}
            </button>
          )}
          <button className="btn btn-primary btn-sm" onClick={openCreate} disabled={!selectedProgram}>
            <Plus size={14} />
            Add Year
          </button>
        </div>
      </div>

      <div className="co-table-card">
        <div className="co-table-wrap">
          <div className="cr-table-header" style={{ gridTemplateColumns: '1.2fr 0.8fr 1fr 1.2fr 0.7fr' }}>
            <span>Year</span><span>Level #</span><span>Course Offerings</span><span>Courses</span><span>Actions</span>
          </div>
          {levels.map((l) => (
            <div key={l.id} className="cr-table-row" style={{ gridTemplateColumns: '1.2fr 0.8fr 1fr 1.2fr 0.7fr' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 8, background: '#e8f4ff', color: '#4facfe' }}>
                  <GraduationCap size={15} />
                </span>
                {l.name}
              </span>
              <span style={{ fontFamily: 'monospace', color: 'var(--accent)', fontSize: '0.85rem' }}>{l.level}</span>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                {l.offerings?.length || 0} offering(s)
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem' }}>
                <Users size={12} color="var(--text-muted)" />
                {l.offerings?.length || 0} course(s)
              </span>
              <div className="cr-td-actions">
                <button className="co-action-btn" title="Edit" onClick={() => openEdit(l)}>
                  <Pencil size={14} />
                </button>
                <button className="co-action-btn co-action-danger" title="Delete" onClick={() => handleDelete(l)}>
                  <Trash2 size={14} />
                </button>
                <button className="co-action-btn" title="More" onClick={() => setViewing(l)}>
                  <MoreHorizontal size={14} />
                </button>
              </div>
            </div>
          ))}
          {levels.length === 0 && (
            <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              {selectedProgram
                ? <>No years defined yet. Use <b>Auto-Generate Year 1–{duration}</b> or <b>Add Year</b> to create the programme years.</>
                : 'Select a programme to view or manage its years.'}
            </div>
          )}
        </div>

        {levels.length > 0 && (
          <div className="co-pagination">
            <span className="co-page-info">
              {levels.length} year(s) defined for {programObj?.name}
            </span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '0.75rem', padding: '0.75rem 1rem', borderRadius: 10, background: '#e8f4ff', color: '#2b6cb0', fontSize: '0.8rem' }}>
        <Info size={15} />
        <span>When you add course offerings in the Curriculum page, you will be able to choose which Year the offering belongs to. This year tag is used to group and generate the timetable.</span>
      </div>

      <div className="dash-footer">© 2024 Automated Timetable Generation System · University Administration Portal · v1.0.2</div>

      {showModal && (
        <div className="cr-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="cr-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="cr-modal-banner">
              <div className="cr-modal-banner-left">
                <div className="cr-modal-banner-icon"><GraduationCap size={16} /></div>
                <div>
                  <h2>{editing ? `Edit ${editing.name}` : 'Add Year'}</h2>
                  <p>{editing ? 'Update the year details.' : `Add a year to ${programObj?.name || 'this programme'}.`}</p>
                </div>
              </div>
              <button className="cr-modal-close" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} className="cr-modal-form">
              <div className="cr-modal-row-2">
                <div className="cr-modal-field">
                  <label>Year Number</label>
                  <input required type="number" min="1" max="10" placeholder="e.g. 1" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} />
                </div>
                <div className="cr-modal-field">
                  <label>Year Name</label>
                  <input placeholder="e.g. Year 1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
              </div>
              <div className="cr-modal-helper">
                <Info size={14} />
                <span>Name defaults to "Year N". Leave blank to use the default.</span>
              </div>
              <div className="cr-modal-actions">
                <button type="button" className="cr-modal-btn cr-modal-btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="cr-modal-btn cr-modal-btn-submit" disabled={submitting}>
                  {submitting ? 'Saving...' : (editing ? 'Update Year' : 'Add Year')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewing && (
        <div className="cr-modal-overlay" onClick={() => setViewing(null)}>
          <div className="cr-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="cr-modal-banner">
              <div className="cr-modal-banner-left">
                <div className="cr-modal-banner-icon"><GraduationCap size={16} /></div>
                <div>
                  <h2>{viewing.name}</h2>
                  <p>{programObj?.name} · Year details</p>
                </div>
              </div>
              <button className="cr-modal-close" onClick={() => setViewing(null)}><X size={16} /></button>
            </div>
            <div style={{ padding: '1.25rem 1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem 1rem', marginBottom: '1rem' }}>
                {[
                  ['Level Number', viewing.level],
                  ['Year Name', viewing.name],
                  ['Course Offerings', viewing.offerings?.length || 0],
                  ['Programme Duration', `${duration} year(s)`],
                ].map(([label, value]) => (
                  <div key={label} style={{ fontSize: '0.85rem' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
                    <div style={{ fontWeight: 600, marginTop: '0.15rem' }}>{value}</div>
                  </div>
                ))}
              </div>
              <h4 style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.5rem' }}>Courses Offered This Year</h4>
              {(viewing.offerings || []).length === 0 ? (
                <div style={{ padding: '1.25rem', textAlign: 'center', borderRadius: 8, background: 'var(--bg)', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  No course offerings assigned to this year yet
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {viewing.offerings.map((o) => (
                    <div key={o.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', borderRadius: 8, background: 'var(--bg)', fontSize: '0.82rem' }}>
                      <span style={{ fontWeight: 600, fontFamily: 'monospace', color: 'var(--accent)' }}>{o.course?.code}</span>
                      <span>{o.course?.name}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{o.semester?.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="cr-modal-actions">
              <button type="button" className="cr-modal-btn cr-modal-btn-submit" onClick={() => setViewing(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
