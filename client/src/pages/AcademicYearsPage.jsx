import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { academicYearsAPI, semestersAPI } from '../services/api';
import {
  Search, Bell, Plus, ChevronLeft, ChevronRight, X, Calendar, Edit3, Trash2, Info, Check,
} from 'lucide-react';

export default function AcademicYearsPage() {
  const [years, setYears] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', startDate: '', endDate: '', isCurrent: false });
  const perPage = 10;

  const load = async () => { try { const res = await academicYearsAPI.list(); setYears(res.data); } catch {} };
  useEffect(() => { load(); }, []);

  const filtered = years.filter(y => !search || y.name?.toLowerCase().includes(search.toLowerCase()));
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const visible = filtered.slice((page - 1) * perPage, page * perPage);

  const currentYear = years.find(y => y.isCurrent);
  const totalSemesters = years.reduce((s, y) => s + (y.semesters?.length || 0), 0);

  const openCreate = () => { setEditing(null); setForm({ name: '', startDate: '', endDate: '', isCurrent: false }); setShowModal(true); };
  const openEdit = (y) => { setEditing(y); setForm({ name: y.name, startDate: y.startDate || '', endDate: y.endDate || '', isCurrent: y.isCurrent }); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try {
      if (editing) { await academicYearsAPI.update(editing.id, form); toast.success('Updated'); }
      else { await academicYearsAPI.create(form); toast.success('Created'); }
      setShowModal(false); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete?')) return;
    try { await academicYearsAPI.delete(id); toast.success('Deleted'); load(); }
    catch (err) { toast.error(err.response?.data?.error || 'Cannot delete'); }
  };

  return (
    <Layout>
      <div className="dash-topbar">
        <div className="dash-search"><Search size={15} color="var(--text-light)" /><input type="text" placeholder="Search academic years..." /></div>
        <div className="dash-topbar-right"><button className="dash-notif-btn"><Bell size={18} /><span className="dash-notif-dot" /></button><div className="dash-divider" /><div className="dash-admin"><div className="dash-avatar-img" style={{ borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>AU</div><div className="dash-admin-info"><span className="dash-admin-name">Admin User</span><span className="dash-admin-role">University Admin</span></div></div></div>
      </div>
      <div className="co-breadcrumb"><a href="#">Dashboard</a><span className="co-breadcrumb-sep">/</span><span className="co-breadcrumb-current">Academic Years</span></div>
      <div className="co-header"><div className="co-header-left"><h1 className="co-title">Academic Years</h1><p className="co-subtitle">Manage academic years and their associated semesters.</p></div></div>

      <div className="cr-stats-row">
        <div className="cr-stat-card"><div className="cr-stat-icon cr-stat-icon-blue"><Calendar size={20} /></div><div className="cr-stat-info"><div className="cr-stat-value">{years.length}</div><div className="cr-stat-label">Total Years</div></div></div>
        <div className="cr-stat-card"><div className="cr-stat-icon cr-stat-icon-green"><Check size={20} /></div><div className="cr-stat-info"><div className="cr-stat-value">{currentYear?.name || '—'}</div><div className="cr-stat-label">Current Year</div></div></div>
        <div className="cr-stat-card"><div className="cr-stat-icon cr-stat-icon-cyan"><Calendar size={20} /></div><div className="cr-stat-info"><div className="cr-stat-value">{totalSemesters}</div><div className="cr-stat-label">Total Semesters</div></div></div>
        <div className="cr-stat-card"><div className="cr-stat-icon cr-stat-icon-orange"><Check size={20} /></div><div className="cr-stat-info"><div className="cr-stat-value">{currentYear ? 'Active' : 'None'}</div><div className="cr-stat-label">Status</div></div></div>
      </div>

      <div className="co-filter-bar" style={{ marginTop: '1rem' }}>
        <div className="co-search-field"><Search size={15} color="var(--text-light)" /><input placeholder="Search year name..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} /></div>
        <div className="co-filter-right"><button className="btn btn-primary btn-sm" onClick={openCreate}><Plus size={14} /> Add Academic Year</button></div>
      </div>

      <div className="co-table-card">
        <div className="co-table-wrap">
          <div className="cr-table-header" style={{ gridTemplateColumns: '1.2fr 1.5fr 1fr 1fr 0.8fr' }}>
            <span>Year Name</span><span>Period</span><span>Semesters</span><span>Status</span><span>Actions</span>
          </div>
          {visible.map(y => (
            <div key={y.id} className="cr-table-row" style={{ gridTemplateColumns: '1.2fr 1.5fr 1fr 1fr 0.8fr' }}>
              <span className="cr-td-name"><div className="cr-td-icon"><Calendar size={15} /></div><div className="cr-td-name-text">{y.name}</div></span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{y.startDate || '—'} to {y.endDate || '—'}</span>
              <span><span className="cr-day-badge" style={{ background: '#e8f4ff', color: '#4facfe' }}>{y.semesters?.length || 0}</span></span>
              <span>{y.isCurrent ? <span className="cr-td-status" style={{ color: '#51cf66', background: '#e6f9e6' }}><Check size={11} /> Current</span> : <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>—</span>}</span>
              <div className="cr-td-actions"><button className="co-action-btn" onClick={() => openEdit(y)}><Edit3 size={14} /></button><button className="co-action-btn co-action-danger" onClick={() => handleDelete(y.id)}><Trash2 size={14} /></button></div>
            </div>
          ))}
          {visible.length === 0 && <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No academic years found</div>}
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
            <div className="cr-modal-banner"><div className="cr-modal-banner-left"><div className="cr-modal-banner-icon"><Calendar size={16} /></div><div><h2>{editing ? 'Edit Academic Year' : 'Add Academic Year'}</h2><p>Define a new academic year for the university calendar.</p></div></div><button className="cr-modal-close" onClick={() => setShowModal(false)}><X size={16} /></button></div>
            <form onSubmit={handleSubmit} className="cr-modal-form">
              <div className="cr-modal-row-2">
                <div className="cr-modal-field"><label>Year Name</label><input required placeholder="e.g. 2025/2026" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                <div className="cr-modal-field"><label style={{ visibility: 'hidden' }}>Current</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.7rem', border: '1px solid #e6e9ee', borderRadius: '8px' }}>
                    <input type="checkbox" checked={form.isCurrent} onChange={e => setForm({ ...form, isCurrent: e.target.checked })} style={{ width: '18px', height: '18px' }} />
                    <span style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>Set as Current Year</span>
                  </label>
                </div>
              </div>
              <div className="cr-modal-row-2">
                <div className="cr-modal-field"><label>Start Date</label><input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} /></div>
                <div className="cr-modal-field"><label>End Date</label><input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} /></div>
              </div>
              <div className="cr-modal-helper"><Info size={14} /><span>Setting a year as current will automatically unset any other current year.</span></div>
              <div className="cr-modal-actions">
                <button type="button" className="cr-modal-btn cr-modal-btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="cr-modal-btn cr-modal-btn-submit" disabled={submitting}>{submitting ? 'Saving...' : editing ? 'Update' : 'Create Year'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
