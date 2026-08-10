import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { facultiesAPI, departmentsAPI } from '../services/api';
import {
  Search, Bell, Plus, ChevronDown, ChevronLeft, ChevronRight,
  X, Landmark, Building2, Edit3, Trash2, MoreHorizontal, Info,
} from 'lucide-react';

export default function FacultiesPage() {
  const [faculties, setFaculties] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', description: '' });
  const perPage = 10;

  const load = async () => {
    try {
      const res = await facultiesAPI.list();
      setFaculties(res.data);
    } catch {}
  };

  useEffect(() => { load(); }, []);

  const filtered = faculties.filter(f => {
    if (search && !f.name?.toLowerCase().includes(search.toLowerCase()) && !f.code?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const visible = filtered.slice((page - 1) * perPage, page * perPage);

  const totalDepts = faculties.reduce((s, f) => s + (f.departments?.length || 0), 0);
  const avgDepts = faculties.length > 0 ? (totalDepts / faculties.length).toFixed(1) : '0';

  const openCreate = () => { setEditing(null); setForm({ name: '', code: '', description: '' }); setShowModal(true); };
  const openEdit = (f) => { setEditing(f); setForm({ name: f.name, code: f.code, description: f.description || '' }); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editing) { await facultiesAPI.update(editing.id, form); toast.success('Faculty updated'); }
      else { await facultiesAPI.create(form); toast.success('Faculty created'); }
      setShowModal(false); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this faculty?')) return;
    try { await facultiesAPI.delete(id); toast.success('Deleted'); load(); }
    catch (err) { toast.error(err.response?.data?.error || 'Cannot delete'); }
  };

  return (
    <Layout>
      <div className="dash-topbar">
        <div className="dash-search"><Search size={15} color="var(--text-light)" /><input type="text" placeholder="Search faculties..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} /></div>
        <div className="dash-topbar-right">
          <button className="dash-notif-btn"><Bell size={18} /><span className="dash-notif-dot" /></button>
          <div className="dash-divider" />
          <div className="dash-admin">
            <div className="dash-avatar-img" style={{ borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>AU</div>
            <div className="dash-admin-info"><span className="dash-admin-name">Admin User</span><span className="dash-admin-role">University Admin</span></div>
          </div>
        </div>
      </div>
      <div className="co-breadcrumb"><a href="#">Dashboard</a><span className="co-breadcrumb-sep">/</span><span className="co-breadcrumb-current">Faculties</span></div>
      <div className="co-header"><div className="co-header-left"><h1 className="co-title">Faculties</h1><p className="co-subtitle">Manage academic faculties and their organizational structure.</p></div></div>

      <div className="cr-stats-row">
        <div className="cr-stat-card"><div className="cr-stat-icon cr-stat-icon-blue"><Landmark size={20} /></div><div className="cr-stat-info"><div className="cr-stat-value">{faculties.length}</div><div className="cr-stat-label">Total Faculties</div></div></div>
        <div className="cr-stat-card"><div className="cr-stat-icon cr-stat-icon-green"><Building2 size={20} /></div><div className="cr-stat-info"><div className="cr-stat-value">{totalDepts}</div><div className="cr-stat-label">Total Departments</div></div></div>
        <div className="cr-stat-card"><div className="cr-stat-icon cr-stat-icon-cyan"><Landmark size={20} /></div><div className="cr-stat-info"><div className="cr-stat-value">{faculties.length}</div><div className="cr-stat-label">Active Faculties</div></div></div>
        <div className="cr-stat-card"><div className="cr-stat-icon cr-stat-icon-orange"><Building2 size={20} /></div><div className="cr-stat-info"><div className="cr-stat-value">{avgDepts}</div><div className="cr-stat-label">Avg. Depts / Faculty</div></div></div>
      </div>

      <div className="co-filter-bar" style={{ marginTop: '1rem' }}>
        <div className="co-search-field"><Search size={15} color="var(--text-light)" /><input type="text" placeholder="Search faculty name or code..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} /></div>
        <div className="co-filter-right"><button className="btn btn-primary btn-sm" onClick={openCreate}><Plus size={14} /> Add Faculty</button></div>
      </div>

      <div className="co-table-card">
        <div className="co-table-wrap">
          <div className="cr-table-header" style={{ gridTemplateColumns: '1.5fr 2fr 1fr 0.8fr' }}>
            <span className="cr-th-name">Faculty</span><span className="cr-th-building">Description</span><span className="cr-th-floor">Departments</span><span className="cr-th-actions">Actions</span>
          </div>
          {visible.map(f => (
            <div key={f.id} className="cr-table-row" style={{ gridTemplateColumns: '1.5fr 2fr 1fr 0.8fr' }}>
              <span className="cr-td-name"><div className="cr-td-icon"><Landmark size={15} /></div><div className="cr-td-name-text">{f.name}<br /><span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>{f.code}</span></div></span>
              <span className="cr-td-building" style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{f.description || '—'}</span>
              <span className="cr-td-floor"><span className="cr-day-badge" style={{ background: '#e8f4ff', color: '#4facfe' }}>{f.departments?.length || 0}</span></span>
              <div className="cr-td-actions"><button className="co-action-btn" onClick={() => openEdit(f)}><Edit3 size={14} /></button><button className="co-action-btn co-action-danger" onClick={() => handleDelete(f.id)}><Trash2 size={14} /></button></div>
            </div>
          ))}
          {visible.length === 0 && <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No faculties found</div>}
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
            <div className="cr-modal-banner">
              <div className="cr-modal-banner-left"><div className="cr-modal-banner-icon"><Landmark size={16} /></div><div><h2>{editing ? 'Edit Faculty' : 'Add New Faculty'}</h2><p>Register a new academic faculty into the system.</p></div></div>
              <button className="cr-modal-close" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} className="cr-modal-form">
              <div className="cr-modal-row-2">
                <div className="cr-modal-field"><label>Faculty Name</label><input required placeholder="e.g. Faculty of Science" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                <div className="cr-modal-field"><label>Faculty Code</label><input required placeholder="e.g. FSCI" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} /></div>
              </div>
              <div className="cr-modal-field"><label>Description</label><textarea placeholder="Brief description of the faculty..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ minHeight: '80px', padding: '0.7rem 0.85rem', border: '1px solid #e6e9ee', borderRadius: '8px', fontSize: '0.9rem', fontFamily: 'inherit', resize: 'vertical' }} /></div>
              <div className="cr-modal-helper"><Info size={14} /><span>Faculties group related departments together. Each department must belong to exactly one faculty.</span></div>
              <div className="cr-modal-actions">
                <button type="button" className="cr-modal-btn cr-modal-btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="cr-modal-btn cr-modal-btn-submit" disabled={submitting}>{submitting ? 'Saving...' : editing ? 'Update Faculty' : 'Create Faculty'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
