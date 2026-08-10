import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { floorsAPI, buildingsAPI } from '../services/api';
import {
  Search,
  Bell,
  Plus,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  Layers,
  Building,
  Info,
  Check,
  Pencil,
  Trash2,
  MoreHorizontal,
  AlertCircle,
  DoorOpen,
} from 'lucide-react';

const STATUS_CONFIG = {
  Active: { color: '#51cf66', bg: '#e6f9e6' },
  Maintenance: { color: '#ff922b', bg: '#fff4e6' },
  Closed: { color: '#ff6b6b', bg: '#fff3f3' },
};

export default function FloorsPage() {
  const [floors, setFloors] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [search, setSearch] = useState('');
  const [filterBuilding, setFilterBuilding] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [form, setForm] = useState({
    buildingId: '',
    name: '',
    status: 'Active',
    description: '',
  });
  const perPage = 10;

  const load = async () => {
    try {
      const [f, b] = await Promise.all([floorsAPI.list(), buildingsAPI.list()]);
      setFloors(f.data);
      setBuildings(b.data);
    } catch {}
  };

  useEffect(() => { load(); }, []);

  const filtered = floors.filter((f) => {
    if (
      search &&
      !f.name?.toLowerCase().includes(search.toLowerCase()) &&
      !f.building?.name?.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    if (filterBuilding && String(f.buildingId) !== String(filterBuilding)) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const visibleRows = filtered.slice((page - 1) * perPage, page * perPage);

  const totalCount = floors.length;
  const activeCount = floors.filter((f) => f.status === 'Active').length;
  const maintenanceCount = floors.filter((f) => f.status === 'Maintenance').length;
  const totalRooms = floors.reduce((s, f) => s + (f.rooms || 0), 0);

  const openCreate = () => {
    setEditing(null);
    setForm({ buildingId: '', name: '', status: 'Active', description: '' });
    setShowModal(true);
  };

  const openEdit = (f) => {
    setEditing(f);
    setForm({
      buildingId: f.buildingId || '',
      name: f.name,
      status: f.status || 'Active',
      description: f.description || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        buildingId: form.buildingId ? Number(form.buildingId) : null,
        name: form.name,
        status: form.status,
        description: form.description,
      };
      if (editing) {
        await floorsAPI.update(editing.id, payload);
        toast.success('Floor updated successfully');
      } else {
        await floorsAPI.create(payload);
        toast.success('Floor created successfully');
      }
      setShowModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save floor');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this floor?')) return;
    try {
      await floorsAPI.delete(id);
      toast.success('Floor deleted');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Cannot delete floor');
    }
  };

  return (
    <Layout>
      <div className="dash-topbar">
        <div className="dash-search">
          <Search size={15} color="var(--text-light)" />
          <input type="text" placeholder="Search floors, buildings..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
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
        <span className="co-breadcrumb-current">Floors</span>
      </div>

      <div className="co-header">
        <div className="co-header-left">
          <h1 className="co-title">Floor Management</h1>
          <p className="co-subtitle">Manage building floors, room assignments, and floor status.</p>
        </div>
        <div className="co-header-stats">
          <div className="co-stat-chip">
            <span className="co-stat-chip-label">Total Floors</span>
            <span className="co-stat-chip-value">{totalCount}</span>
          </div>
        </div>
      </div>

      <div className="fl-stats-row">
        <div className="fl-stat-card">
          <div className="fl-stat-icon fl-stat-icon-blue">
            <Layers size={20} />
          </div>
          <div className="fl-stat-info">
            <div className="fl-stat-value">{totalCount}</div>
            <div className="fl-stat-label">Total Floors</div>
          </div>
        </div>
        <div className="fl-stat-card">
          <div className="fl-stat-icon fl-stat-icon-green">
            <Check size={20} />
          </div>
          <div className="fl-stat-info">
            <div className="fl-stat-value">{activeCount}</div>
            <div className="fl-stat-label">Active</div>
          </div>
        </div>
        <div className="fl-stat-card">
          <div className="fl-stat-icon fl-stat-icon-orange">
            <AlertCircle size={20} />
          </div>
          <div className="fl-stat-info">
            <div className="fl-stat-value">{maintenanceCount}</div>
            <div className="fl-stat-label">Maintenance</div>
          </div>
        </div>
        <div className="fl-stat-card">
          <div className="fl-stat-icon fl-stat-icon-cyan">
            <DoorOpen size={20} />
          </div>
          <div className="fl-stat-info">
            <div className="fl-stat-value">{totalRooms}</div>
            <div className="fl-stat-label">Total Rooms</div>
          </div>
        </div>
      </div>

      <div className="co-filter-bar">
        <div className="co-search-field">
          <Search size={15} color="var(--text-light)" />
          <input type="text" placeholder="Search floor number or building..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <div className="co-filter-dept-wrap">
          <select value={filterBuilding} onChange={(e) => { setFilterBuilding(e.target.value); setPage(1); }}>
            <option value="">All Buildings</option>
            {buildings.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          <ChevronDown size={14} className="co-select-icon" />
        </div>
        <div className="co-filter-right">
          <button className="btn btn-primary btn-sm" onClick={openCreate}>
            <Plus size={14} />
            Add New Floor
          </button>
        </div>
      </div>

      <div className="co-table-card">
        <div className="co-table-wrap">
          <div className="fl-table-header">
            <span className="fl-th-name">Floor Name</span>
            <span className="fl-th-building">Building</span>
            <span className="fl-th-rooms">Rooms</span>
            <span className="fl-th-status">Status</span>
            <span className="fl-th-actions">Actions</span>
          </div>
          {visibleRows.map((f) => {
            const sc = STATUS_CONFIG[f.status] || STATUS_CONFIG.Active;
            return (
              <div key={f.id} className="fl-table-row">
                <span className="fl-td-name">
                  <div className="fl-td-icon">
                    <Layers size={16} />
                  </div>
                  <div className="fl-td-name-text">{f.name}</div>
                </span>
                <span className="fl-td-building">
                  <Building size={13} />
                  {f.building?.name || '—'}
                </span>
                <span className="fl-td-rooms">
                  <span className="fl-rooms-pill">{f.rooms}</span>
                </span>
                <span className="fl-td-status" style={{ color: sc.color, background: sc.bg }}>
                  {f.status}
                </span>
                <div className="fl-td-actions">
                  <button className="co-action-btn" title="Edit" onClick={() => openEdit(f)}>
                    <Pencil size={14} />
                  </button>
                  <button className="co-action-btn co-action-danger" title="Delete" onClick={() => handleDelete(f.id)}>
                    <Trash2 size={14} />
                  </button>
                  <button className="co-action-btn" title="More" onClick={() => setViewing(f)}>
                    <MoreHorizontal size={14} />
                  </button>
                </div>
              </div>
            );
          })}
          {visibleRows.length === 0 && <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No floors found</div>}
        </div>

        <div className="co-pagination">
          <span className="co-page-info">
            Showing {((page - 1) * perPage) + 1}–{Math.min(page * perPage, filtered.length)} of {filtered.length} floors
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
        <div className="fl-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="fl-modal" onClick={(e) => e.stopPropagation()}>
            <button className="fl-modal-close" onClick={() => setShowModal(false)}>
              <X size={16} />
            </button>

            <div className="fl-modal-header">
              <div className="fl-modal-header-icon">
                <Plus size={18} />
              </div>
              <div>
                <h2>{editing ? 'Edit Floor' : 'Add New Floor'}</h2>
                <p>{editing ? 'Update the floor information.' : 'Register a new floor to a specific building. Classrooms can be added to this floor later.'}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="fl-modal-form">
              <div className="fl-modal-row-2">
                <div className="fl-modal-field">
                  <label>Target Building</label>
                  <div className="fl-modal-select-wrap">
                    <select
                      required
                      value={form.buildingId}
                      onChange={(e) => setForm({ ...form, buildingId: e.target.value })}
                    >
                      <option value="">Select building...</option>
                      {buildings.map((b) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="fl-modal-select-icon" />
                  </div>
                </div>
                <div className="fl-modal-field">
                  <label>Floor Name / Number</label>
                  <input
                    required
                    placeholder="e.g. 4th Floor"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
              </div>

              <div className="fl-modal-row-2">
                <div className="fl-modal-field">
                  <label>Status</label>
                  <div className="fl-modal-select-wrap">
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                    >
                      <option value="Active">Active</option>
                      <option value="Maintenance">Under Maintenance</option>
                      <option value="Closed">Closed</option>
                    </select>
                    <ChevronDown size={14} className="fl-modal-select-icon" />
                  </div>
                </div>
                <div className="fl-modal-field fl-modal-field-empty" />
              </div>

              <div className="fl-modal-field">
                <label>Description (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="Brief description of this floor's purpose, facilities, or notable features..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div className="fl-modal-info-box">
                <Info size={16} />
                <span>After creating the floor, you can assign classrooms to it from the <strong>Classrooms</strong> management page.</span>
              </div>

              <div className="fl-modal-actions">
                <button
                  type="button"
                  className="fl-modal-btn fl-modal-btn-cancel"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="fl-modal-btn fl-modal-btn-submit"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="fl-modal-spinner" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Plus size={15} />
                      {editing ? 'Update Floor' : 'Create Floor'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewing && (
        <div className="fl-modal-overlay" onClick={() => setViewing(null)}>
          <div className="fl-modal" onClick={(e) => e.stopPropagation()}>
            <div className="fl-modal-header">
              <div className="fl-modal-header-icon">
                <Layers size={18} />
              </div>
              <div>
                <h2>{viewing.name}</h2>
                <p>Floor details</p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem 1rem', padding: '0.5rem 1.5rem 1rem' }}>
              {[
                ['Building', viewing.building?.name || '—'],
                ['Status', viewing.status],
                ['Rooms', viewing.rooms],
                ['Description', viewing.description || '—'],
                ['Created', viewing.createdAt ? new Date(viewing.createdAt).toLocaleString() : '—'],
              ].map(([label, value]) => (
                <div key={label} style={{ fontSize: '0.85rem' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
                  <div style={{ fontWeight: 600, marginTop: '0.15rem' }}>{value}</div>
                </div>
              ))}
            </div>
            <div className="fl-modal-actions">
              <button type="button" className="fl-modal-btn fl-modal-btn-cancel" onClick={() => setViewing(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
