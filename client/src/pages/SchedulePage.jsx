import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import api from '../services/api';
import { scheduleAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export default function SchedulePage() {
  const { user } = useAuth();
  const [busyBlocks, setBusyBlocks] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [slots, setSlots] = useState([]);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [schRes, slotRes, progRes] = await Promise.all([
        scheduleAPI.get(),
        api.get('/timeslots'),
        api.get('/programs')
      ]);
      const myDepts = user?.departments?.length ? user.departments : (user?.department ? [user.department] : []);
      const myPrograms = (progRes.data || []).filter(p => myDepts.includes(p.department?.name || p.department));
      const myProgramIds = myPrograms.map(p => p.id);
      const active = (slotRes.data || []).filter(s => s.active && (!s.programId || myProgramIds.includes(s.programId)));
      setSlots(active);

      const busy = {};
      for (const day of DAYS) {
        busy[day] = {};
        for (const s of active) busy[day][s.startTime] = false;
      }
      for (const day of DAYS) {
        const entries = schRes.data[day] || [];
        for (const entry of entries) {
          for (const s of active) {
            if (entry.startTime === s.startTime && entry.endTime === s.endTime) {
              busy[day][s.startTime] = true;
            }
          }
        }
      }
      setBusyBlocks(busy);
    } catch {}
    setLoading(false);
  };

  const toggleBlock = (day, startTime) => {
    setBusyBlocks((prev) => ({
      ...prev,
      [day]: { ...prev[day], [startTime]: !prev[day][startTime] }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = [];
      for (const day of DAYS) {
        for (const s of slots) {
          if (busyBlocks[day]?.[s.startTime]) {
            data.push({ day, startTime: s.startTime, endTime: s.endTime });
          }
        }
      }
      await scheduleAPI.update(data);
      toast.success('Schedule saved. Regenerate the timetable to apply changes.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    }
    setSaving(false);
  };

  const handleUploadCSV = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const lines = evt.target.result.split('\n').filter((l) => l.trim());
        const newBusy = {};
        for (const day of DAYS) {
          newBusy[day] = {};
          for (const s of slots) newBusy[day][s.startTime] = false;
        }
        for (const line of lines) {
          const parts = line.split(',').map((s) => s.trim());
          if (parts.length >= 3 && DAYS.includes(parts[0])) {
            const match = slots.find((s) => parts[1] === s.startTime && parts[2] === s.endTime);
            if (match) newBusy[parts[0]][match.startTime] = true;
          }
        }
        setBusyBlocks(newBusy);
        toast.success('CSV loaded. Save to apply.');
      } catch {
        toast.error('Invalid CSV. Format: day,startTime,endTime');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const countBusy = () => {
    let c = 0;
    for (const day of DAYS)
      for (const s of slots)
        if (busyBlocks[day]?.[s.startTime]) c++;
    return c;
  };

  return (
    <Layout>
      <div className="page-header">
        <h1>My Schedule</h1>
        <p>Toggle time slots to mark when you are unavailable.</p>
      </div>

      <div className="btn-group mb-2">
        <button className="btn btn-success" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Schedule'}
        </button>
        <label className="btn btn-ghost" style={{ cursor: 'pointer' }}>
          Upload CSV
          <input type="file" accept=".csv" onChange={handleUploadCSV} style={{ display: 'none' }} />
        </label>
        <span style={{ fontSize: '0.85rem', color: '#888', alignSelf: 'center' }}>
          {countBusy()} slot(s) marked busy
        </span>
      </div>

      {loading ? (
        <div className="empty-state">Loading schedule...</div>
      ) : slots.length === 0 ? (
        <div className="empty-state">No active time slots. Configure them on the Time Slots page first.</div>
      ) : (
        <div className="timetable-wrapper">
          <div className="timetable-grid">
            <div className="tt-cell tt-header">Time Slot</div>
            {DAYS.map((d) => (
              <div key={d} className="tt-cell tt-header">{d}</div>
            ))}
            {slots.map((s) => (
              <div key={s.id}>
                <div className="tt-cell tt-time" style={{ fontSize: '0.75rem', lineHeight: 1.3 }}>
                  <strong>{s.name}</strong><br />
                  <span style={{ fontWeight: 400 }}>{s.startTime} – {s.endTime}</span>
                </div>
                {DAYS.map((day) => {
                  const isBusy = busyBlocks[day]?.[s.startTime];
                  return (
                    <div
                      key={`${day}-${s.startTime}`}
                      className="tt-cell"
                      style={{
                        cursor: 'pointer',
                        background: isBusy ? '#ff6b6b' : '#e8f4fd',
                        transition: 'background 0.15s',
                        minHeight: '50px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.8rem',
                        fontWeight: isBusy ? 600 : 400,
                        color: isBusy ? '#fff' : '#888'
                      }}
                      onClick={() => toggleBlock(day, s.startTime)}
                    >
                      {isBusy ? 'Unavailable' : 'Available'}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <div style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#888', borderTop: '1px solid #eee' }}>
            Click a period to toggle. Red = unavailable (scheduler will skip).<br />
            CSV format: <code>day,startTime,endTime</code> (e.g. <code>Monday,08:00,08:55</code>)
            — one line per busy period.
          </div>
        </div>
      )}
    </Layout>
  );
}
