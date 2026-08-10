import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { classroomsAPI } from '../services/api';
import {
  Search,
  Bell,
  Plus,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  DoorOpen,
  Building,
  Layers,
  Users,
  Check,
  Pencil,
  Trash2,
  MoreHorizontal,
  AlertCircle,
  Info,
} from 'lucide-react';

const ROOM_TYPES = ['Lecture Hall', 'Lab', 'Seminar Room', 'Tutorial Room'];
const STATUSES = ['Available', 'Maintenance'];

const STATUS_CONFIG = {
  Available: { color: '#51cf66', bg: '#e6f9e6' },
  Maintenance: { color: '#ff6b6b', bg: '#fff3f3' },
};

const TYPE_COLORS = {
  'Lecture Hall': { color: '#4facfe', bg: '#e8f4ff' },
  'Lab': { color: '#cc5de8', bg: '#f3e8ff' },
  'Seminar Room': { color: '#ff922b', bg: '#fff4e6' },
  'Tutorial Room': { color: '#51cf66', bg: '#e6f9e6' },
};

export default function ClassroomsPage() {
  const [classrooms, setClassrooms] = useState([]);
  const [search, setSearch] = useState('');
  const [filterBuilding, setFilterBuilding] = useState('');
  const [filterType, setFilterType] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    building: '',
    floor: '',
    capacity: '',
    type: 'Lecture Hall',
    status: 'Available',
  });
  const perPage = 10;

  const load = async () => {
    try {
      const res = await classroomsAPI.list();
      setClassrooms(res.data);
    } catch {}
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = classrooms.filter((r) => {
    if (search && !r.name?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterBuilding && r.building !== filterBuilding) return false;
    if (filterType && r.type !== filterType) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const visibleRows = filtered.slice((page - 1) * perPage, page * perPage);

  const totalCount = classrooms.length;
  const totalCapacity = classrooms.reduce((s, r) => s + (parseInt(r.capacity) || 0), 0);
  const availableCount = classrooms.filter((r) => r.status === 'Available').length;
  const maintenanceCount = classrooms.filter((r) => r.status === 'Maintenance').length;

  const buildingNames = [...new Set(classrooms.map((r) => r.building).filter(Boolean))];

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', building: '', floor: '', capacity: '', type: 'Lecture Hall', status: 'Available' });
    setShowModal(true);
  };

  const openEdit = (r) => {
    setEditing(r);
    setForm({
      name: r.name,
      building: r.building || '',
      floor: r.floor || '',
      capacity: r.capacity,
      type: r.type || 'Lecture Hall',
      status: r.status || 'Available',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        capacity: Number(form.capacity),
      };
      if (editing) {
        await classroomsAPI.update(editing.id, payload);
        toast.success('Classroom updated successfully');
      } else {
        await classroomsAPI.create(payload);
        toast.success('Classroom created successfully');
      }
      setShowModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save classroom');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this classroom?')) return;
    try {
      await classroomsAPI.delete(id);
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
          <input type="text" placeholder="Search rooms, buildings, types..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
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
        <span className="co-breadcrumb-current">Classrooms</span>
      </div>

      {/* Header */}
      <div className="co-header">
        <div className="co-header-left">
          <h1 className="co-title">Classrooms</h1>
          <p className="co-subtitle">Manage available classrooms, capacities, and room assignments.</p>
        </div>
        <div className="co-header-stats">
          <div className="co-stat-chip">
            <span className="co-stat-chip-label">Total Rooms</span>
            <span className="co-stat-chip-value">{totalCount}</span>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="cr-stats-row">
        <div className="cr-stat-card">
          <div className="cr-stat-icon cr-stat-icon-blue">
            <DoorOpen size={20} />
          </div>
          <div className="cr-stat-info">
            <div className="cr-stat-value">{totalCount}</div>
            <div className="cr-stat-label">Total Rooms</div>
          </div>
        </div>
        <div className="cr-stat-card">
          <div className="cr-stat-icon cr-stat-icon-green">
            <Check size={20} />
          </div>
          <div className="cr-stat-info">
            <div className="cr-stat-value">{availableCount}</div>
            <div className="cr-stat-label">Available</div>
          </div>
        </div>
        <div className="cr-stat-card">
          <div className="cr-stat-icon cr-stat-icon-orange">
            <AlertCircle size={20} />
          </div>
          <div className="cr-stat-info">
            <div className="cr-stat-value">{maintenanceCount}</div>
            <div className="cr-stat-label">Maintenance</div>
          </div>
        </div>
        <div className="cr-stat-card">
          <div className="cr-stat-icon cr-stat-icon-cyan">
            <Users size={20} />
          </div>
          <div className="cr-stat-info">
            <div className="cr-stat-value">{totalCapacity.toLocaleString()}</div>
            <div className="cr-stat-label">Total Capacity</div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="co-filter-bar">
        <div className="co-search-field">
          <Search size={15} color="var(--text-light)" />
          <input type="text" placeholder="Search room number..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <div className="co-filter-dept-wrap">
          <select value={filterBuilding} onChange={(e) => { setFilterBuilding(e.target.value); setPage(1); }}>
            <option value="">All Buildings</option>
            {buildingNames.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
          <ChevronDown size={14} className="co-select-icon" />
        </div>
        <div className="co-filter-dept-wrap">
          <select value={filterType} onChange={(e) => { setFilterType(e.target.value); setPage(1); }}>
            <option value="">All Types</option>
            {ROOM_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <ChevronDown size={14} className="co-select-icon" />
        </div>
        <div className="co-filter-right">
          <button className="btn btn-primary btn-sm" onClick={openCreate}>
            <Plus size={14} />
            Add New Classroom
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="co-table-card">
        <div className="co-table-wrap">
          <div className="cr-table-header">
            <span className="cr-th-name">Room Number</span>
            <span className="cr-th-building">Building</span>
            <span className="cr-th-floor">Floor</span>
            <span className="cr-th-capacity">Capacity</span>
            <span className="cr-th-type">Type</span>
            <span className="cr-th-status">Status</span>
            <span className="cr-th-actions">Actions</span>
          </div>
          {visibleRows.map((r) => {
            const sc = STATUS_CONFIG[r.status] || STATUS_CONFIG.Available;
            const tc = TYPE_COLORS[r.type] || TYPE_COLORS['Lecture Hall'];
            return (
              <div key={r.id} className="cr-table-row">
                <span className="cr-td-name">
                  <div className="cr-td-icon">
                    <DoorOpen size={15} />
                  </div>
                  <div className="cr-td-name-text">{r.name}</div>
                </span>
                <span className="cr-td-building">
                  <Building size={13} />
                  {r.building || '—'}
                </span>
                <span className="cr-td-floor">
                  <Layers size={12} />
                  {r.floor || '—'}
                </span>
                <span className="cr-td-capacity">
                  <Users size={13} />
                  {r.capacity}
                </span>
                <span className="cr-td-type" style={{ color: tc.color, background: tc.bg }}>
                  {r.type || 'Lecture Hall'}
                </span>
                <span className="cr-td-status" style={{ color: sc.color, background: sc.bg }}>
                  {r.status}
                </span>
                <div className="cr-td-actions">
                  <button className="co-action-btn" title="Edit" onClick={() => openEdit(r)}>
                    <Pencil size={14} />
                  </button>
                  <button className="co-action-btn co-action-danger" title="Delete" onClick={() => handleDelete(r.id)}>
                    <Trash2 size={14} />
                  </button>
                  <button className="co-action-btn" title="More" onClick={() => setViewing(r)}>
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
            Showing {((page - 1) * perPage) + 1}–{Math.min(page * perPage, filtered.length)} of {filtered.length} classrooms
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

      {/* Create Classroom Modal */}
      {showModal && (
        <div className="cr-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="cr-modal" onClick={(e) => e.stopPropagation()}>
            {/* Blue Header Bar */}
            <div className="cr-modal-banner">
              <div className="cr-modal-banner-left">
                <div className="cr-modal-banner-icon">
                  <DoorOpen size={16} />
                </div>
                <div>
                  <h2>{editing ? 'Edit Classroom' : 'Add New Classroom'}</h2>
                  <p>{editing ? 'Update the details of this academic space.' : 'Register a new academic space into the system. All fields are required for scheduling.'}</p>
                </div>
              </div>
              <button className="cr-modal-close" onClick={() => setShowModal(false)}>
                <X size={16} />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="cr-modal-form">
              {/* Row 1 */}
              <div className="cr-modal-row-2">
                <div className="cr-modal-field">
                  <label>Room Number</label>
                  <input
                    required
                    placeholder="e.g. LH-105"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="cr-modal-field">
                  <label>Building</label>
                  <input
                    required
                    placeholder="e.g. Science Hub"
                    value={form.building}
                    onChange={(e) => setForm({ ...form, building: e.target.value })}
                  />
                </div>
              </div>

              {/* Row 2 */}
              <div className="cr-modal-row-2">
                <div className="cr-modal-field">
                  <label>Floor</label>
                  <div className="cr-modal-select-wrap">
                    <select
                      required
                      value={form.floor}
                      onChange={(e) => setForm({ ...form, floor: e.target.value })}
                    >
                      <option value="">Select floor...</option>
                      <option value="Basement">Basement</option>
                      <option value="Ground Floor">Ground Floor</option>
                      <option value="1st Floor">1st Floor</option>
                      <option value="2nd Floor">2nd Floor</option>
                      <option value="3rd Floor">3rd Floor</option>
                      <option value="4th Floor">4th Floor</option>
                    </select>
                    <ChevronDown size={14} className="cr-modal-select-icon" />
                  </div>
                </div>
                <div className="cr-modal-field">
                  <label>Capacity</label>
                  <div className="cr-modal-input-icon-wrap">
                    <Users size={14} className="cr-modal-input-icon" />
                    <input
                      type="number"
                      min="1"
                      placeholder="0"
                      value={form.capacity}
                      onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Row 3 */}
              <div className="cr-modal-row-2">
                <div className="cr-modal-field">
                  <label>Room Type</label>
                  <div className="cr-modal-select-wrap">
                    <select
                      value={form.type}
                      onChange={(e) => setForm({ ...form, type: e.target.value })}
                    >
                      <option value="">Select type...</option>
                      {ROOM_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="cr-modal-select-icon" />
                  </div>
                </div>
                <div className="cr-modal-field">
                  <label>Availability Status</label>
                  <div className="cr-modal-select-wrap">
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="cr-modal-select-icon" />
                  </div>
                </div>
              </div>

              {/* Helper Note */}
              <div className="cr-modal-helper">
                <Info size={14} />
                <span>Newly added rooms will be automatically included in the next timetable generation run unless marked as 'Maintenance'.</span>
              </div>

              {/* Actions */}
              <div className="cr-modal-actions">
                <button
                  type="button"
                  className="cr-modal-btn cr-modal-btn-cancel"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="cr-modal-btn cr-modal-btn-submit"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="cr-modal-spinner" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Plus size={15} />
                      {editing ? 'Update Room' : 'Create Room'}
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
        <div className="cr-modal-overlay" onClick={() => setViewing(null)}>
          <div className="cr-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cr-modal-banner">
              <div className="cr-modal-banner-left">
                <div className="cr-modal-banner-icon">
                  <DoorOpen size={16} />
                </div>
                <div>
                  <h2>{viewing.name}</h2>
                  <p>Room details</p>
                </div>
              </div>
              <button className="cr-modal-close" onClick={() => setViewing(null)}>
                <X size={16} />
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem 1rem', padding: '1.25rem 1.5rem' }}>
              {[
                ['Building', viewing.building || '—'],
                ['Floor', viewing.floor || '—'],
                ['Capacity', viewing.capacity],
                ['Type', viewing.type || 'Lecture Hall'],
                ['Status', viewing.status],
              ].map(([label, value]) => (
                <div key={label} style={{ fontSize: '0.85rem' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
                  <div style={{ fontWeight: 600, marginTop: '0.15rem' }}>{value}</div>
                </div>
              ))}
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
