import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { semestersAPI, academicYearsAPI } from '../services/api';
import {
  Search, Bell, Plus, ChevronLeft, ChevronRight, ChevronDown, X, CalendarDays, Edit3, Trash2, Info, Check,
} from 'lucide-react';

export default function SemestersPage() {
  const [semesters, setSemesters] = useState([]);
  const [years, setYears] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', academicYearId: '', isCurrent: false });
  const perPage = 10;

  const load = async () => {
    try { const [s, y] = await Promise.all([semestersAPI.list(), academicYearsAPI.list()]); setSemesters(s.data); setYears(y.data); } catch {}
  };
  useEffect(() => { load(); }, []);

  const filtered = semesters.filter(s => !search || s.name?.toLowerCase().includes(search.toLowerCase()));
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const visible = filtered.slice((page - 1) * perPage, page * perPage);
  const currentSem = semesters.find(s => s.isCurrent);

  const openCreate = () => { setEditing(null); setForm({ name: '', academicYearId: '', isCurrent: false }); setShowModal(true); };
  const openEdit = (s) => { setEditing(s); setForm({ name: s.name, academicYearId: s.academicYearId || '', isCurrent: s.isCurrent }); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try {
      if (editing) { await semestersAPI.update(editing.id, form); toast.success('Updated'); }
      else { await semestersAPI.create(form); toast.success('Created'); }
      setShowModal(false); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete?')) return;
    try { await semestersAPI.delete(id); toast.success('Deleted'); load(); }
    catch (err) { toast.error(err.response?.data?.error || 'Cannot delete'); }
  };

  return (
    <Layout>
      <div className="dash-topbar">
        <div className="dash-search"><Search size={15} color="var(--text-light)" /><input type="text" placeholder="Search semesters..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} /></div>
        <div className="dash-topbar-right"><button className="dash-notif-btn"><Bell size={18} /><span className="dash-notif-dot" /></button><div className="dash-divider" /><div className="dash-admin"><div className="dash-avatar-img" style={{ borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>AU</div><div className="dash-admin-info"><span className="dash-admin-name">Admin User</span><span className="dash-admin-role">University Admin</span></div></div></div>
      </div>
      <div className="co-breadcrumb"><a href="#">Dashboard</a><span className="co-breadcrumb-sep">/</span><span className="co-breadcrumb-current">Semesters</span></div>
      <div className="co-header"><div className="co-header-left"><h1 className="co-title">Semesters</h1><p className="co-subtitle">Manage semesters within each academic year.</p></div></div>

      <div className="cr-stats-row">
        <div className="cr-stat-card"><div className="cr-stat-icon cr-stat-icon-blue"><CalendarDays size={20} /></div><div className="cr-stat-info"><div className="cr-stat-value">{semesters.length}</div><div className="cr-stat-label">Total Semesters</div></div></div>
        <div className="cr-stat-card"><div className="cr-stat-icon cr-stat-icon-green"><Check size={20} /></div><div className="cr-stat-info"><div className="cr-stat-value">{currentSem?.name || '—'}</div><div className="cr-stat-label">Current Semester</div></div></div>
        <div className="cr-stat-card"><div className="cr-stat-icon cr-stat-icon-cyan"><CalendarDays size={20} /></div><div className="cr-stat-info"><div className="cr-stat-value">{years.length}</div><div className="cr-stat-label">Academic Years</div></div></div>
        <div className="cr-stat-card"><div className="cr-stat-icon cr-stat-icon-orange"><Check size={20} /></div><div className="cr-stat-info"><div className="cr-stat-value">{currentSem ? 'Active' : 'None'}</div><div className="cr-stat-label">Status</div></div></div>
      </div>

      <div className="co-filter-bar" style={{ marginTop: '1rem' }}>
        <div className="co-search-field"><Search size={15} color="var(--text-light)" /><input placeholder="Search semester name..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} /></div>
        <div className="co-filter-right"><button className="btn btn-primary btn-sm" onClick={openCreate}><Plus size={14} /> Add Semester</button></div>
      </div>

      <div className="co-table-card">
        <div className="co-table-wrap">
          <div className="cr-table-header" style={{ gridTemplateColumns: '1.5fr 1.5fr 1fr 0.8fr' }}>
            <span>Semester Name</span><span>Academic Year</span><span>Status</span><span>Actions</span>
          </div>
          {visible.map(s => (
            <div key={s.id} className="cr-table-row" style={{ gridTemplateColumns: '1.5fr 1.5fr 1fr 0.8fr' }}>
              <span className="cr-td-name"><div className="cr-td-icon"><CalendarDays size={15} /></div><div className="cr-td-name-text">{s.name}</div></span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{s.academicYear?.name || '—'}</span>
              <span>{s.isCurrent ? <span className="cr-td-status" style={{ color: '#51cf66', background: '#e6f9e6' }}><Check size={11} /> Current</span> : <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>—</span>}</span>
              <div className="cr-td-actions"><button className="co-action-btn" onClick={() => openEdit(s)}><Edit3 size={14} /></button><button className="co-action-btn co-action-danger" onClick={() => handleDelete(s.id)}><Trash2 size={14} /></button></div>
            </div>
          ))}
          {visible.length === 0 && <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No semesters found</div>}
        </div>
        <div className="co-pagination">
          <span className="co-page-info">Showing {((page - 1) * perPage) + 1}–{Math.min(page * perPage, filtered.length)} of {filtered.length}</span>
          <div className="co-page-controls">
            <button className="co-page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={14} /></button>
            {Array.from({ length: totalPages }, (_, i) => <button key={i + 1} className={`co-page-num ${page === i + 1 ? 'active' : ''}`} onClick={() => setPage(i + 1)}>{i + 1}</button>)}
            <button className="co-page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight size={14} /></button>
          </div>
        </div>
      </div>
      <div className="dash-footer">© 2024 Automated Timetable Generation System · University Administration Portal · v1.0.2</div>

      {showModal && (
        <div className="cr-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="cr-modal" onClick={e => e.stopPropagation()}>
            <div className="cr-modal-banner"><div className="cr-modal-banner-left"><div className="cr-modal-banner-icon"><CalendarDays size={16} /></div><div><h2>{editing ? 'Edit Semester' : 'Add Semester'}</h2><p>Define a new semester within an academic year.</p></div></div><button className="cr-modal-close" onClick={() => setShowModal(false)}><X size={16} /></button></div>
            <form onSubmit={handleSubmit} className="cr-modal-form">
              <div className="cr-modal-row-2">
                <div className="cr-modal-field"><label>Semester Name</label><input required placeholder="e.g. Semester 1" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                <div className="cr-modal-field"><label>Academic Year</label>
                  <div className="cr-modal-select-wrap"><select required value={form.academicYearId} onChange={e => setForm({ ...form, academicYearId: e.target.value })}><option value="">Select year...</option>{years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}</select><ChevronDown size={14} className="cr-modal-select-icon" /></div>
                </div>
              </div>
              <div className="cr-modal-field">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.7rem', border: '1px solid #e6e9ee', borderRadius: '8px' }}>
                  <input type="checkbox" checked={form.isCurrent} onChange={e => setForm({ ...form, isCurrent: e.target.checked })} style={{ width: '18px', height: '18px' }} />
                  <span style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>Set as Current Semester</span>
                </label>
              </div>
              <div className="cr-modal-helper"><Info size={14} /><span>Setting a semester as current will automatically unset any other current semester.</span></div>
              <div className="cr-modal-actions">
                <button type="button" className="cr-modal-btn cr-modal-btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="cr-modal-btn cr-modal-btn-submit" disabled={submitting}>{submitting ? 'Saving...' : editing ? 'Update' : 'Create Semester'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
