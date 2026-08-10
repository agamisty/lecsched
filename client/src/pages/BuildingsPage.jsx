import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { buildingsAPI } from '../services/api';
import {
  Search,
  Bell,
  Plus,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  Building,
  MapPin,
  Layers,
  Users,
  Check,
  Pencil,
  Trash2,
  MoreHorizontal,
  Download,
} from 'lucide-react';

function exportBuildingsCSV(buildings) {
  const rows = [
    ['Building', 'Code', 'Address', 'Floors', 'Capacity', 'Status'],
    ...buildings.map((b) => [b.name, b.code, b.address || '', b.floors || 0, b.capacity || 0, b.status]),
  ];
  const csv = rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'buildings.csv';
  a.click();
  URL.revokeObjectURL(url);
  toast.success('Buildings exported to CSV');
}

export default function BuildingsPage() {
  const [buildings, setBuildings] = useState([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [form, setForm] = useState({
    name: '',
    code: '',
    address: '',
    floors: '',
    capacity: '',
    status: 'Active',
  });
  const perPage = 10;

  const load = async () => {
    try {
      const res = await buildingsAPI.list();
      setBuildings(res.data);
    } catch {}
  };

  useEffect(() => { load(); }, []);

  const filtered = buildings.filter((b) => {
    if (
      search &&
      !b.name?.toLowerCase().includes(search.toLowerCase()) &&
      !b.code?.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    if (filterStatus && b.status !== filterStatus) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const visibleRows = filtered.slice((page - 1) * perPage, page * perPage);

  const totalCount = buildings.length;
  const totalFloors = buildings.reduce((s, b) => s + (b.floors || 0), 0);
  const totalCapacity = buildings.reduce((s, b) => s + (b.capacity || 0), 0);
  const activeCount = buildings.filter((b) => b.status === 'Active').length;

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', code: '', address: '', floors: '', capacity: '', status: 'Active' });
    setShowModal(true);
  };

  const openEdit = (b) => {
    setEditing(b);
    setForm({
      name: b.name,
      code: b.code,
      address: b.address || '',
      floors: b.floors || '',
      capacity: b.capacity || '',
      status: b.status || 'Active',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        floors: parseInt(form.floors) || 0,
        capacity: parseInt(form.capacity) || 0,
      };
      if (editing) {
        await buildingsAPI.update(editing.id, payload);
        toast.success('Building updated successfully');
      } else {
        await buildingsAPI.create(payload);
        toast.success('Building created successfully');
      }
      setShowModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save building');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this building?')) return;
    try {
      await buildingsAPI.delete(id);
      toast.success('Building deleted');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Cannot delete building');
    }
  };

  return (
    <Layout>
      <div className="dash-topbar">
        <div className="dash-search">
          <Search size={15} color="var(--text-light)" />
          <input type="text" placeholder="Search buildings, codes, addresses..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
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

      <div className="co-breadcrumb">
        <a href="#">Dashboard</a>
        <span className="co-breadcrumb-sep">/</span>
        <span className="co-breadcrumb-current">Buildings</span>
      </div>

      <div className="co-header">
        <div className="co-header-left">
          <h1 className="co-title">Campus Buildings</h1>
          <p className="co-subtitle">Manage campus infrastructure, facilities, and building information.</p>
        </div>
        <div className="co-header-stats">
          <div className="co-stat-chip">
            <span className="co-stat-chip-label">Total Buildings</span>
            <span className="co-stat-chip-value">{totalCount}</span>
          </div>
        </div>
      </div>

      <div className="bld-stats-row">
        <div className="bld-stat-card">
          <div className="bld-stat-icon bld-stat-icon-blue">
            <Building size={20} />
          </div>
          <div className="bld-stat-info">
            <div className="bld-stat-value">{totalCount}</div>
            <div className="bld-stat-label">Total Buildings</div>
          </div>
        </div>
        <div className="bld-stat-card">
          <div className="bld-stat-icon bld-stat-icon-cyan">
            <Layers size={20} />
          </div>
          <div className="bld-stat-info">
            <div className="bld-stat-value">{totalFloors}</div>
            <div className="bld-stat-label">Total Floors</div>
          </div>
        </div>
        <div className="bld-stat-card">
          <div className="bld-stat-icon bld-stat-icon-green">
            <Users size={20} />
          </div>
          <div className="bld-stat-info">
            <div className="bld-stat-value">{totalCapacity.toLocaleString()}</div>
            <div className="bld-stat-label">Active Capacity</div>
          </div>
        </div>
        <div className="bld-stat-card">
          <div className="bld-stat-icon bld-stat-icon-orange">
            <Check size={20} />
          </div>
          <div className="bld-stat-info">
            <div className="bld-stat-value">{activeCount}</div>
            <div className="bld-stat-label">Active Buildings</div>
          </div>
        </div>
      </div>

      <div className="co-filter-bar">
        <div className="co-search-field">
          <Search size={15} color="var(--text-light)" />
          <input type="text" placeholder="Search by name or code..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <div className="co-filter-dept-wrap">
          <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          <ChevronDown size={14} className="co-select-icon" />
        </div>
        <div className="co-filter-right">
          <button className="btn btn-ghost btn-sm" onClick={() => exportBuildingsCSV(filtered)}>
            <Download size={14} />
            Export
          </button>
          <button className="btn btn-primary btn-sm" onClick={openCreate}>
            <Plus size={14} />
            Add Building
          </button>
        </div>
      </div>

      <div className="co-table-card">
        <div className="co-table-wrap">
          <div className="bld-table-header">
            <span className="bld-th-name">Building</span>
            <span className="bld-th-address">Physical Address</span>
            <span className="bld-th-floors">Total Floors</span>
            <span className="bld-th-capacity">Capacity</span>
            <span className="bld-th-status">Status</span>
            <span className="bld-th-actions">Actions</span>
          </div>
          {visibleRows.map((b) => (
            <div key={b.id} className="bld-table-row">
              <span className="bld-td-name">
                <div className="bld-td-icon">{b.code}</div>
                <div>
                  <div className="bld-td-name-text">{b.name}</div>
                  <div className="bld-td-name-code">{b.code}</div>
                </div>
              </span>
              <span className="bld-td-address">
                <MapPin size={12} />
                {b.address || '—'}
              </span>
              <span className="bld-td-floors">
                <Layers size={13} />
                {b.floors}
              </span>
              <span className="bld-td-capacity">
                {b.capacity.toLocaleString()}
              </span>
              <span className="bld-td-status" style={{
                color: b.status === 'Active' ? '#51cf66' : '#ff6b6b',
                background: b.status === 'Active' ? '#e6f9e6' : '#fff3f3',
              }}>
                {b.status}
              </span>
              <div className="bld-td-actions">
                <button className="co-action-btn" title="Edit" onClick={() => openEdit(b)}>
                  <Pencil size={14} />
                </button>
                <button className="co-action-btn co-action-danger" title="Delete" onClick={() => handleDelete(b.id)}>
                  <Trash2 size={14} />
                </button>
                <button className="co-action-btn" title="More" onClick={() => setViewing(b)}>
                  <MoreHorizontal size={14} />
                </button>
              </div>
            </div>
          ))}
          {visibleRows.length === 0 && <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No buildings found</div>}
        </div>

        <div className="co-pagination">
          <span className="co-page-info">
            Showing {((page - 1) * perPage) + 1}–{Math.min(page * perPage, filtered.length)} of {filtered.length} buildings
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

      <div className="dash-footer">
        © 2024 Automated Timetable Generation System · University Administration Portal · v1.0.2
      </div>

      {showModal && (
        <div className="bld-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="bld-modal" onClick={(e) => e.stopPropagation()}>
            <div className="bld-modal-header">
              <h2>{editing ? 'Edit Building' : 'Add New Building'}</h2>
              <p>{editing ? 'Update the building information.' : 'Register a new campus building and configure its basic information.'}</p>
            </div>

            <form onSubmit={handleSubmit} className="bld-modal-form">
              <div className="bld-modal-row-2">
                <div className="bld-modal-field">
                  <label>Building Name</label>
                  <input
                    required
                    placeholder="e.g. Science Wing A"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="bld-modal-field">
                  <label>Short Code</label>
                  <input
                    required
                    placeholder="e.g. SWA"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                  />
                </div>
              </div>

              <div className="bld-modal-field">
                <label>Physical Address</label>
                <input
                  placeholder="Complete campus address..."
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>

              <div className="bld-modal-row-2">
                <div className="bld-modal-field">
                  <label>Total Floors</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 5"
                    value={form.floors}
                    onChange={(e) => setForm({ ...form, floors: e.target.value })}
                  />
                </div>
                <div className="bld-modal-field">
                  <label>Approx. Capacity</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 1200"
                    value={form.capacity}
                    onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                  />
                </div>
              </div>

              <div className="bld-modal-row-2">
                <div className="bld-modal-field">
                  <label>Status</label>
                  <div className="bld-modal-select-wrap">
                    <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                    <ChevronDown size={14} className="bld-modal-select-icon" />
                  </div>
                </div>
                <div className="bld-modal-field bld-modal-field-empty" />
              </div>

              <div className="bld-modal-actions">
                <button
                  type="button"
                  className="bld-modal-btn bld-modal-btn-cancel"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bld-modal-btn bld-modal-btn-submit"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="bld-modal-spinner" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Plus size={15} />
                      {editing ? 'Update Building' : 'Create Building'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewing && (
        <div className="bld-modal-overlay" onClick={() => setViewing(null)}>
          <div className="bld-modal" onClick={(e) => e.stopPropagation()}>
            <div className="bld-modal-header">
              <h2>{viewing.name}</h2>
              <p>Building details</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem 1rem', padding: '1rem 1.5rem' }}>
              {[
                ['Code', viewing.code],
                ['Address', viewing.address || '—'],
                ['Total Floors', viewing.floors],
                ['Capacity', viewing.capacity?.toLocaleString()],
                ['Status', viewing.status],
                ['Created', viewing.createdAt ? new Date(viewing.createdAt).toLocaleString() : '—'],
              ].map(([label, value]) => (
                <div key={label} style={{ fontSize: '0.85rem' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
                  <div style={{ fontWeight: 600, marginTop: '0.15rem' }}>{value}</div>
                </div>
              ))}
            </div>
            <div className="bld-modal-actions">
              <button type="button" className="bld-modal-btn bld-modal-btn-cancel" onClick={() => setViewing(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
