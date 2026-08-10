import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { timeslotsAPI } from '../services/api';
import {
  Search,
  Bell,
  Plus,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  Clock,
  Check,
  MoreHorizontal,
  Calendar,
  Download,
  Upload,
  AlertCircle,
  Info,
  Pencil,
  Trash2,
  Timer,
  Ban,
  Zap,
} from 'lucide-react';



const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const ALL_STATUSES = ['Active', 'Inactive'];

const DAY_COLORS = {
  Mon: { color: '#4facfe', bg: '#e8f4ff' },
  Tue: { color: '#cc5de8', bg: '#f3e8ff' },
  Wed: { color: '#ff922b', bg: '#fff4e6' },
  Thu: { color: '#51cf66', bg: '#e6f9e6' },
  Fri: { color: '#e64980', bg: '#ffe6f0' },
  Sat: { color: '#ff6b6b', bg: '#fff3f3' },
  Sun: { color: '#868e96', bg: '#f1f3f5' },
};

const STATUS_COLORS = {
  Active:   { color: '#51cf66', bg: '#e6f9e6' },
  Inactive: { color: '#ff6b6b', bg: '#fff3f3' },
};

export default function TimeSlotsPage() {
  const [slots, setSlots] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [viewingSlot, setViewingSlot] = useState(null);
  const importRef = useRef(null);
  const [form, setForm] = useState({
    name: '',
    startTime: '',
    endTime: '',
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    active: true,
  });
  const perPage = 10;

  const load = async () => {
    try {
      const res = await timeslotsAPI.list();
      if (Array.isArray(res.data)) {
        setSlots(res.data);
      } else if (res.data?.timeslots) {
        setSlots(res.data.timeslots);
      }
    } catch {}
  };

  useEffect(() => { load(); }, []);

  const filtered = slots.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (s.name || '').toLowerCase().includes(q) ||
      (s.startTime || '').toLowerCase().includes(q) ||
      (s.endTime || '').toLowerCase().includes(q);
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const visibleRows = filtered.slice((page - 1) * perPage, page * perPage);

  const activeCount = slots.filter((s) => s.active !== false).length;
  const inactiveCount = slots.filter((s) => s.active === false).length;
  const avgDuration = slots.length > 0
    ? (slots.reduce((sum, s) => {
        const diff = (new Date(`2000-01-01T${s.endTime}`) - new Date(`2000-01-01T${s.startTime}`)) / 3600000;
        return sum + (diff || 1);
      }, 0) / slots.length).toFixed(1)
    : '0';

  const toggleDay = (day) => {
    setForm((f) => ({
      ...f,
      days: f.days.includes(day) ? f.days.filter((d) => d !== day) : [...f.days, day],
    }));
  };

  const openCreate = () => {
    setEditingSlot(null);
    setForm({
      name: '',
      startTime: '',
      endTime: '',
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      active: true,
    });
    setShowModal(true);
  };

  const openEdit = (slot) => {
    setEditingSlot(slot);
    setForm({
      name: slot.name,
      startTime: slot.startTime,
      endTime: slot.endTime,
      days: Array.isArray(slot.days) ? [...slot.days] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      active: slot.active !== false,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        name: form.name,
        startTime: form.startTime,
        endTime: form.endTime,
        days: form.days,
        active: form.active,
      };
      if (editingSlot) {
        await timeslotsAPI.update(editingSlot.id, payload);
        toast.success('Time slot updated successfully');
      } else {
        await timeslotsAPI.create(payload);
        toast.success('Time slot created successfully');
      }
      setShowModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save time slot');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this time slot?')) return;
    try {
      await timeslotsAPI.delete(id);
      toast.success('Time slot deleted');
      load();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const downloadTemplate = () => {
    const csv = 'Name,Start,End,Days,Status\nMorning Block A,08:00,10:00,"Mon,Tue,Wed,Thu,Fri",Active\nMidday Block,10:00,12:00,"Mon,Tue,Wed,Thu,Fri",Active\nAfternoon Block,14:00,16:00,"Mon,Tue,Wed,Thu,Fri",Inactive\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'timeslots_template.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Template downloaded');
  };

  const handleCSVImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const lines = String(reader.result || '').split('\n').filter((l) => l.trim());
      let imported = 0;
      for (const line of lines.slice(1)) {
        const parts = line.split(',');
        if (parts.length < 4) continue;
        const name = parts[0].trim().replace(/^"|"$/g, '');
        const startTime = parts[1].trim().replace(/^"|"$/g, '');
        const endTime = parts[2].trim().replace(/^"|"$/g, '');
        if (!name || !startTime || !endTime) continue;
        const daysPart = parts.slice(3).join(',');
        const days = daysPart
          .replace(/^"|"$/g, '')
          .split(',')
          .map((d) => d.trim())
          .filter((d) => WEEKDAYS.includes(d));
        const status = parts[parts.length - 1].trim().replace(/^"|"$/g, '').toLowerCase();
        try {
          await timeslotsAPI.create({
            name,
            startTime,
            endTime,
            days: days.length ? days : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
            active: status !== 'inactive',
          });
          imported++;
        } catch {}
      }
      if (imported > 0) {
        toast.success(`${imported} time slot(s) imported`);
        load();
      } else {
        toast.error('No valid rows found. Use the template format.');
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
          <input type="text" placeholder="Search slots, times, schedules..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
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
        <span className="co-breadcrumb-current">Time Slots</span>
      </div>

      {/* Header */}
      <div className="co-header">
        <div className="co-header-left">
          <h1 className="co-title">Time Slots</h1>
          <p className="co-subtitle">Configure the academic timing grid and class durations.</p>
        </div>
        <div className="co-header-stats">
          <div className="co-stat-chip">
            <span className="co-stat-chip-label">Total Slots</span>
            <span className="co-stat-chip-value">{slots.length}</span>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="ts-stats-row">
        <div className="ts-stat-card">
          <div className="ts-stat-icon ts-stat-icon-blue">
            <Timer size={20} />
          </div>
          <div className="ts-stat-info">
            <div className="ts-stat-value">{slots.length}</div>
            <div className="ts-stat-label">Total Slots</div>
          </div>
        </div>
        <div className="ts-stat-card">
          <div className="ts-stat-icon ts-stat-icon-green">
            <Check size={20} />
          </div>
          <div className="ts-stat-info">
            <div className="ts-stat-value">{activeCount}</div>
            <div className="ts-stat-label">Active</div>
          </div>
        </div>
        <div className="ts-stat-card">
          <div className="ts-stat-icon ts-stat-icon-red">
            <Ban size={20} />
          </div>
          <div className="ts-stat-info">
            <div className="ts-stat-value">{inactiveCount}</div>
            <div className="ts-stat-label">Inactive</div>
          </div>
        </div>
        <div className="ts-stat-card">
          <div className="ts-stat-icon ts-stat-icon-cyan">
            <Clock size={20} />
          </div>
          <div className="ts-stat-info">
            <div className="ts-stat-value">{avgDuration}h</div>
            <div className="ts-stat-label">Avg. Duration</div>
          </div>
        </div>
      </div>

      {/* Two-column: Teaching Days + Bulk Import */}
      <div className="ts-two-col">
        {/* Active Teaching Days */}
        <div className="ts-card ts-days-card">
          <div className="ts-days-header">
            <div className="ts-days-icon">
              <Calendar size={16} />
            </div>
            <div>
              <h3 className="ts-days-title">Active Teaching Days</h3>
              <p className="ts-days-sub">Select which days are scheduled for classes</p>
            </div>
          </div>
          <div className="ts-days-grid">
            {WEEKDAYS.map((day) => {
              const dc = DAY_COLORS[day];
              const selected = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].includes(day);
              return (
                <button
                  key={day}
                  className={`ts-day-pill ${selected ? 'ts-day-active' : 'ts-day-inactive'}`}
                  style={selected ? { background: dc.color, borderColor: dc.color } : { borderColor: dc.color, color: dc.color }}
                >
                  {day}
                </button>
              );
            })}
          </div>
          <div className="ts-days-footer">
            <Info size={13} />
            <span>5 teaching days active · Mon–Fri standard university schedule</span>
          </div>
        </div>

        {/* Bulk Import */}
        <div className="ts-card ts-import-card">
          <div className="ts-days-header">
            <div className="ts-import-icon">
              <Upload size={16} />
            </div>
            <div>
              <h3 className="ts-days-title">Bulk Import Utility</h3>
              <p className="ts-days-sub">Import multiple time slots from a CSV file</p>
            </div>
          </div>
          <div className="ts-import-actions">
            <button className="ts-import-btn ts-import-btn-download" onClick={downloadTemplate}>
              <Download size={14} />
              Download Template
            </button>
            <button className="ts-import-btn ts-import-btn-upload" onClick={() => importRef.current?.click()}>
              <Upload size={14} />
              Upload CSV
            </button>
            <input ref={importRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleCSVImport} />
          </div>
          <div className="ts-import-note">
            <Clock size={12} />
            <span>Supported format: .csv with columns Slot ID, Name, Start, End, Days, Status</span>
          </div>
        </div>
      </div>

      {/* Active Scheduling Slots */}
      <div className="ts-card ts-table-card">
        <div className="ts-table-top">
          <div>
            <h3 className="ts-table-title">Active Scheduling Slots</h3>
            <p className="ts-table-sub">All configured time slots available for timetable generation</p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={openCreate}>
            <Plus size={14} />
            Add Time Slot
          </button>
        </div>

        <div className="ts-table-wrap">
          <div className="ts-table-header">
            <span className="ts-th ts-th-name">Slot Name</span>
            <span className="ts-th ts-th-time">Time Interval</span>
            <span className="ts-th ts-th-days">Frequency</span>
            <span className="ts-th ts-th-status">Status</span>
            <span className="ts-th ts-th-actions">Actions</span>
          </div>
          {visibleRows.map((slot) => {
            const isActive = slot.active !== false;
            return (
              <div key={slot.id} className="ts-table-row">
                <span className="ts-td ts-td-name">{slot.name}</span>
                <span className="ts-td ts-td-time">
                  <Clock size={12} />
                  <span>{slot.startTime} – {slot.endTime}</span>
                </span>
                <span className="ts-td ts-td-days">
                  {Array.isArray(slot.days) && slot.days.map((d) => {
                    const dc = DAY_COLORS[d] || DAY_COLORS.Mon;
                    return (
                      <span key={d} className="ts-day-badge" style={{ color: dc.color, background: dc.bg }}>
                        {d}
                      </span>
                    );
                  })}
                </span>
                <span className="ts-td ts-td-status" style={{ color: isActive ? '#51cf66' : '#ff6b6b', background: isActive ? '#e6f9e6' : '#fff3f3' }}>
                  <Check size={11} />
                  {isActive ? 'Active' : 'Inactive'}
                </span>
                <div className="ts-td ts-td-actions">
                  <button className="co-action-btn" title="Edit" onClick={() => openEdit(slot)}>
                    <Pencil size={14} />
                  </button>
                  <button className="co-action-btn co-action-danger" title="Delete" onClick={() => handleDelete(slot.id)}>
                    <Trash2 size={14} />
                  </button>
                  <button className="co-action-btn" title="More" onClick={() => setViewingSlot(slot)}>
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
            Showing {((page - 1) * perPage) + 1}–{Math.min(page * perPage, filtered.length)} of {filtered.length} slots
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
      <div className="ts-info-grid">
        <div className="ts-info-card">
          <div className="ts-info-icon ts-info-icon-blue">
            <Timer size={20} />
          </div>
          <div>
            <h4 className="ts-info-title">Standard Duration</h4>
            <p className="ts-info-desc">Lectures and labs are scheduled in 2-hour blocks. Tutorials run 1-hour blocks. All slots align to these durations.</p>
          </div>
        </div>
        <div className="ts-info-card">
          <div className="ts-info-icon ts-info-icon-red">
            <Ban size={20} />
          </div>
          <div>
            <h4 className="ts-info-title">Conflict Prevention</h4>
            <p className="ts-info-desc">Overlapping slots are automatically blocked. The generator validates all assignments against active time windows.</p>
          </div>
        </div>
        <div className="ts-info-card">
          <div className="ts-info-icon ts-info-icon-purple">
            <Zap size={20} />
          </div>
          <div>
            <h4 className="ts-info-title">Bulk Generation</h4>
            <p className="ts-info-desc">Generate the full weekly schedule across all slots in one click. The algorithm respects room, lecturer, and time constraints.</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="dash-footer">
        © 2024 Automated Timetable Generation System · University Administration Portal · v1.0.2
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="ts-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="ts-modal" onClick={(e) => e.stopPropagation()}>
            {/* Banner Header */}
            <div className="ts-modal-banner">
              <div className="ts-modal-banner-left">
                <div className="ts-modal-banner-icon">
                  <Clock size={16} />
                </div>
                <div>
                  <h2>{editingSlot ? 'Edit Time Slot' : 'Add New Time Slot'}</h2>
                  <p>Configure a new time window for scheduling classes.</p>
                </div>
              </div>
              <button className="ts-modal-close" onClick={() => setShowModal(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="ts-modal-form">
              {/* Row 1 */}
              <div className="ts-modal-row-2">
                <div className="ts-modal-field">
                  <label>Slot Name</label>
                  <input
                    required
                    placeholder="e.g. Morning Block A"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="ts-modal-field">
                  <label>Status</label>
                  <div className="ts-modal-select-wrap">
                    <select
                      value={form.active ? 'true' : 'false'}
                      onChange={(e) => setForm({ ...form, active: e.target.value === 'true' })}
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                    <ChevronDown size={14} className="ts-modal-select-icon" />
                  </div>
                </div>
              </div>

              {/* Row 2 */}
              <div className="ts-modal-row-2">
                <div className="ts-modal-field">
                  <label>Start Time</label>
                  <input
                    type="time"
                    required
                    value={form.startTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                  />
                </div>
                <div className="ts-modal-field">
                  <label>End Time</label>
                  <input
                    type="time"
                    required
                    value={form.endTime}
                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                  />
                </div>
              </div>

              {/* Days */}
              <div className="ts-modal-field">
                <label>Teaching Days</label>
                <div className="ts-modal-days-grid">
                  {WEEKDAYS.map((day) => {
                    const dc = DAY_COLORS[day];
                    const selected = form.days.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        className={`ts-modal-day-pill ${selected ? 'ts-modal-day-active' : 'ts-modal-day-inactive'}`}
                        style={selected ? { background: dc.color, borderColor: dc.color } : { borderColor: dc.color, color: dc.color }}
                        onClick={() => toggleDay(day)}
                      >
                        {selected && <Check size={11} />}
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Helper Note */}
              <div className="ts-modal-helper">
                <Info size={14} />
                <span>Lectures and labs use 2-hour blocks; tutorials use 1-hour blocks. Ensure at least 15-minute breaks between consecutive slots.</span>
              </div>

              {/* Actions */}
              <div className="ts-modal-actions">
                <button type="button" className="ts-modal-btn ts-modal-btn-cancel" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="ts-modal-btn ts-modal-btn-submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <span className="ts-modal-spinner" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Plus size={15} />
                      {editingSlot ? 'Update Slot' : 'Create Slot'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {viewingSlot && (
        <div className="ts-modal-overlay" onClick={() => setViewingSlot(null)}>
          <div className="ts-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ts-modal-banner">
              <div className="ts-modal-banner-left">
                <div className="ts-modal-banner-icon">
                  <Clock size={16} />
                </div>
                <div>
                  <h2>{viewingSlot.name}</h2>
                  <p>Time slot details</p>
                </div>
              </div>
              <button className="ts-modal-close" onClick={() => setViewingSlot(null)}>
                <X size={16} />
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem 1rem', padding: '1.25rem 1.5rem' }}>
              {[
                ['Start Time', viewingSlot.startTime],
                ['End Time', viewingSlot.endTime],
                ['Status', viewingSlot.active === false ? 'Inactive' : 'Active'],
                ['Teaching Days', Array.isArray(viewingSlot.days) ? viewingSlot.days.join(', ') : '—'],
              ].map(([label, value]) => (
                <div key={label} style={{ fontSize: '0.85rem' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
                  <div style={{ fontWeight: 600, marginTop: '0.15rem' }}>{value}</div>
                </div>
              ))}
            </div>
            <div className="ts-modal-actions">
              <button type="button" className="ts-modal-btn ts-modal-btn-submit" onClick={() => setViewingSlot(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
