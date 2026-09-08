import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import {
  timetableAPI,
  academicYearsAPI,
  semestersAPI,
  programsAPI,
  academicLevelsAPI,
} from '../services/api';
import {
  Download,
  Printer,
  FileJson,
  Filter,
  Clock,
  BookOpen,
  X,
  ChevronDown,
  FileText,
  FileDown,
  Loader2,
  Save,
  RotateCcw,
} from 'lucide-react';

const DAY_KEYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

const PERIODS = [
  { num: 1,  label: 'P1',  start: '08:00', end: '08:55' },
  { num: 2,  label: 'P2',  start: '09:00', end: '09:55' },
  { num: 3,  label: 'P3',  start: '10:30', end: '11:25' },
  { num: 4,  label: 'P4',  start: '11:30', end: '12:25' },
  { num: 5,  label: 'P5',  start: '13:00', end: '13:55' },
  { num: 6,  label: 'P6',  start: '14:00', end: '14:55' },
  { num: 7,  label: 'P7',  start: '15:00', end: '15:55' },
  { num: 8,  label: 'P8',  start: '16:00', end: '16:55' },
  { num: 9,  label: 'P9',  start: '17:00', end: '17:55' },
  { num: 10, label: 'P10', start: '18:00', end: '18:55' },
];

const TIME_TO_PERIOD = {};
PERIODS.forEach((p) => { TIME_TO_PERIOD[p.start] = p.num; });

const TYPE_COLORS = {
  lecture: { bg: '#e8f4fd', border: '#4facfe', text: '#1565c0', badge: '#4facfe' },
  lab:     { bg: '#e0f7fa', border: '#00bcd4', text: '#00838f', badge: '#00bcd4' },
  default: { bg: '#f3e5f5', border: '#ab47bc', text: '#7b1fa2', badge: '#ab47bc' },
};

function getTypeColor(type) {
  if (!type) return TYPE_COLORS.default;
  return TYPE_COLORS[type.toLowerCase()] || TYPE_COLORS.default;
}

function timeToPeriodNum(time) {
  if (TIME_TO_PERIOD[time]) return TIME_TO_PERIOD[time];
  const [h, m] = time.split(':').map(Number);
  const mins = h * 60 + m;
  for (const p of PERIODS) {
    const [ph, pm] = p.start.split(':').map(Number);
    const [eh, em] = p.end.split(':').map(Number);
    if (mins >= ph * 60 + pm && mins <= eh * 60 + em) return p.num;
  }
  return null;
}

function timeToPeriodEnd(time) {
  const [h, m] = time.split(':').map(Number);
  const mins = h * 60 + m;
  let last = null;
  for (const p of PERIODS) {
    const [ph, pm] = p.start.split(':').map(Number);
    if (ph * 60 + pm < mins) last = p.num;
  }
  return last;
}

function buildGrid(slots) {
  const grid = {};
  DAY_KEYS.forEach((d) => { grid[d] = new Array(10).fill(null); });

  for (const slot of slots) {
    const day = slot.day;
    const startNum = timeToPeriodNum(slot.startTime);
    if (!day || !startNum) continue;

    const endNum = timeToPeriodEnd(slot.endTime) || startNum;
    const span = endNum >= startNum ? endNum - startNum + 1 : 1;
    const idx = startNum - 1;

    if (idx >= 0 && idx < 10) {
      grid[day][idx] = {
        id: slot.id,
        day: slot.day,
        startTime: slot.startTime,
        endTime: slot.endTime,
        courseCode: slot.courseCode,
        courseName: slot.courseName,
        courseType: slot.courseType,
        lecturer: slot.lecturerName,
        room: slot.classroomName,
        startPeriod: startNum,
        endPeriod: endNum,
        span,
      };
    }
  }
  return grid;
}

function applyMoves(slots, moves) {
  const keys = Object.keys(moves);
  if (keys.length === 0) return slots;
  return slots.map((s) => {
    const mv = moves[s.id];
    return mv ? { ...s, day: mv.day, startTime: mv.startTime, endTime: mv.endTime } : s;
  });
}

function exportJSON(groupName, grid, slots) {
  const meta = {
    title: groupName,
    semester: '',
    college: 'College of Science',
    image_orientation: 'landscape',
  };

  const times = {};
  PERIODS.forEach((p) => { times[p.num] = `${p.start}-${p.end}`; });

  const days = {};
  DAY_KEYS.forEach((day, di) => {
    days[DAY_KEYS[di]] = PERIODS.map((p, pi) => {
      const cell = grid[day][pi];
      if (!cell) return null;
      return {
        course: cell.courseCode,
        room: cell.room || '',
        group: '',
        lecturer: cell.lecturer || '',
        notes: '',
        start_period: cell.startPeriod,
        end_period: cell.endPeriod,
      };
    });
  });

  return JSON.stringify({ meta, times, days, raw_text_errors: [] }, null, 2);
}

function exportASCII(groupName, grid) {
  const colW = 22;
  const periodW = 5;
  const dayW = 10;

  const lines = [];
  lines.push('');
  lines.push('='.repeat(150));
  lines.push(`  ${groupName}`);
  lines.push('  Weekly Class Timetable');
  lines.push('='.repeat(150));
  lines.push('');

  const header = 'Period'.padEnd(periodW) + 'Time'.padEnd(14);
  const dayHeaders = DAY_KEYS.map((d) => d.padEnd(colW));
  lines.push(header + dayHeaders.join(''));
  lines.push('-'.repeat(150));

  for (let pi = 0; pi < 10; pi++) {
    const p = PERIODS[pi];
    const timeStr = `${p.start}-${p.end}`;
    let row = p.label.padEnd(periodW) + timeStr.padEnd(14);

    for (const day of DAY_KEYS) {
      const cell = grid[day][pi];
      if (!cell) {
        row += '—'.padEnd(colW);
      } else {
        const text = `${cell.courseCode}\n  ${cell.room || ''} ${cell.lecturer || ''}`;
        const short = `${cell.courseCode} ${cell.lecturer || ''}`.substring(0, colW - 1);
        row += short.padEnd(colW);
      }
    }
    lines.push(row);
  }

  lines.push('-'.repeat(150));
  lines.push('');
  lines.push('Legend:');
  lines.push('  Lecture = Standard lecture class');
  lines.push('  Lab     = Laboratory session');
  lines.push('');

  const detailLines = [];
  detailLines.push('');
  detailLines.push('DETAILED SCHEDULE:');
  detailLines.push('-'.repeat(150));
  for (const day of DAY_KEYS) {
    let hasContent = false;
    for (let pi = 0; pi < 10; pi++) {
      if (grid[day][pi]) { hasContent = true; break; }
    }
    if (!hasContent) continue;
    detailLines.push(`\n${day.toUpperCase()}`);
    for (let pi = 0; pi < 10; pi++) {
      const cell = grid[day][pi];
      if (!cell) continue;
      const p = PERIODS[pi];
      detailLines.push(`  ${p.label} (${p.start}-${p.end})  ${cell.courseCode} - ${cell.courseName || ''}`);
      detailLines.push(`              Room: ${cell.room || 'TBD'}  Lecturer: ${cell.lecturer || 'TBD'}  Type: ${cell.courseType || 'Lecture'}`);
      detailLines.push(`              Periods ${cell.startPeriod}-${cell.endPeriod}`);
    }
  }

  return lines.join('\n') + detailLines.join('\n');
}

export default function TimetablePage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [years, setYears] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [levels, setLevels] = useState([]);

  const [selYear, setSelYear] = useState('');
  const [selSemester, setSelSemester] = useState('');
  const [selProgram, setSelProgram] = useState('');
  const [selLevel, setSelLevel] = useState('');

  const [grouped, setGrouped] = useState({});
  const [groupKeys, setGroupKeys] = useState([]);
  const [activeGroup, setActiveGroup] = useState('');
  const [totalSlots, setTotalSlots] = useState(0);

  const [dragInfo, setDragInfo] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const [pendingMoves, setPendingMoves] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    academicYearsAPI.list().then((r) => {
      setYears(r.data.years || r.data || []);
    }).catch(() => {});
    semestersAPI.list().then((r) => {
      setSemesters(r.data.semesters || r.data || []);
    }).catch(() => {});
    programsAPI.list().then((r) => {
      setPrograms(r.data.programs || r.data || []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (selProgram) {
      academicLevelsAPI.list({ programId: selProgram }).then((r) => {
        setLevels(r.data.levels || r.data || []);
      }).catch(() => {});
    } else {
      setLevels([]);
      setSelLevel('');
    }
  }, [selProgram]);

  useEffect(() => {
    if (selYear) {
      semestersAPI.list({ academicYearId: selYear }).then((r) => {
        setSemesters(r.data.semesters || r.data || []);
      }).catch(() => {});
    } else {
      semestersAPI.list().then((r) => {
        setSemesters(r.data.semesters || r.data || []);
      }).catch(() => {});
    }
  }, [selYear]);

  const filterParams = useCallback(() => {
    const params = {};
    if (selYear) params.academicYearId = selYear;
    if (selSemester) params.semesterId = selSemester;
    if (selProgram) params.programId = selProgram;
    if (selLevel) params.academicLevelId = selLevel;
    return params;
  }, [selYear, selSemester, selProgram, selLevel]);

  const loadTimetable = useCallback(async () => {
    setLoading(true);
    try {
      const res = await timetableAPI.get(filterParams());
      const g = res.data.grouped || {};
      const keys = Object.keys(g);
      setGrouped(g);
      setGroupKeys(keys);
      setTotalSlots(res.data.total || 0);
      if (keys.length > 0 && !activeGroup) {
        setActiveGroup(keys[0]);
      } else if (keys.length > 0 && !keys.includes(activeGroup)) {
        setActiveGroup(keys[0]);
      } else if (keys.length === 0) {
        setActiveGroup('');
      }
    } catch (err) {
      toast.error('Failed to load timetable');
    }
    setLoading(false);
  }, [filterParams, activeGroup]);

  useEffect(() => { loadTimetable(); }, []);

  const currentGroup = grouped[activeGroup];
  const displayedSlots = currentGroup ? applyMoves(currentGroup.slots || [], pendingMoves) : [];
  const grid = currentGroup ? buildGrid(displayedSlots) : null;
  const unsavedCount = Object.keys(pendingMoves).length;

  const countClasses = () => {
    if (!grid) return 0;
    let c = 0;
    DAY_KEYS.forEach((d) => { grid[d].forEach((cell) => { if (cell) c++; }); });
    return c;
  };

  const handleExportJSON = () => {
    if (!grid) { toast.error('No timetable to export'); return; }
    const json = exportJSON(activeGroup, grid, currentGroup?.slots || []);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timetable-${activeGroup.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('JSON exported');
  };

  const handleExportASCII = () => {
    if (!grid) { toast.error('No timetable to export'); return; }
    const text = exportASCII(activeGroup, grid);
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timetable-${activeGroup.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Text timetable exported');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = async () => {
    try {
      const params = {};
      if (selSemester) params.semesterId = selSemester;
      if (selProgram) params.programId = selProgram;
      if (selLevel) params.academicLevelId = selLevel;
      const res = await timetableAPI.pdf(params);
      const blob = new Blob([res.data], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      toast.success('Timetable opened in a new tab — use Print / Save as PDF');
    } catch (err) {
      toast.error('Failed to export timetable');
    }
  };

  const periodFromX = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const col = Math.floor((e.clientX - rect.left) / (rect.width / 10));
    return Math.max(0, Math.min(9, col));
  };

  const handleCellDragStart = (e, cell, day, startP) => {
    if (!isAdmin) return;
    e.dataTransfer.setData('text/plain', String(cell.id));
    e.dataTransfer.effectAllowed = 'move';
    setDragInfo({ id: cell.id, span: cell.span || 1, day, startPeriod: startP + 1, code: cell.courseCode });
  };

  const handleRowDragOver = (e, day) => {
    if (!isAdmin || !dragInfo) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const col = periodFromX(e);
    setDropTarget({ day, period: col + 1 });
  };

  const handleRowDrop = (e, day) => {
    e.preventDefault();
    if (!isAdmin) return;
    const info = dragInfo;
    setDropTarget(null);
    setDragInfo(null);
    if (!info) return;
    const col = periodFromX(e);
    if (col + info.span > 10) {
      toast.error('Not enough room on the timetable at that time');
      return;
    }
    const startTime = PERIODS[col].start;
    const endTime = PERIODS[col + info.span - 1].end;
    if (day === info.day && info.startPeriod === col + 1) return;

    for (let i = col; i < col + info.span; i++) {
      const existing = grid[day]?.[i];
      if (existing && existing.id !== info.id) {
        toast.error(`${info.code} can't go there — ${existing.courseCode} already occupies ${day} ${PERIODS[i].start}`);
        return;
      }
    }

    setPendingMoves((prev) => ({ ...prev, [info.id]: { day, startTime, endTime } }));
    toast.success(`${info.code} moved to ${day} ${startTime}–${endTime} — press Save to apply`);
  };

  const handleSaveMoves = async () => {
    const moves = Object.entries(pendingMoves).map(([id, m]) => ({ id: Number(id), ...m }));
    if (moves.length === 0 || saving) return;
    setSaving(true);
    try {
      const res = await timetableAPI.batchMove(moves);
      const { applied = 0, failed = [], warnings = [] } = res.data || {};

      if (failed.length > 0) {
        toast.error(
          `${applied} of ${moves.length} change${moves.length === 1 ? '' : 's'} saved — ${failed.length} blocked: ` +
            failed.map((f) => f.error.replace(/^This conflicts with /, '')).join(' · '),
          { duration: 8000 }
        );
      } else {
        toast.success(`${applied || moves.length} change${(applied || moves.length) === 1 ? '' : 's'} saved`);
      }
      if (warnings.length > 0) {
        const desc = warnings.slice(0, 4).map((w) => {
          const where = w.programme ? ` (${w.programme}${w.level ? ` L${w.level}` : ''})` : '';
          return `${w.type === 'room' ? 'Room clash' : 'Lecturer clash'} with ${w.courseCode}${where} ${w.time}`;
        });
        toast.warning(desc.join(' · '), { duration: 7000 });
      }
      setPendingMoves({});
      await loadTimetable();
    } catch (err) {
      // A rejected request does not necessarily mean nothing was saved: the
      // platform may kill the response (timeout / gateway error) after the
      // server already committed the moves. Reconcile against fresh data
      // before deciding whether to report an error.
      const serverMsg = err.response?.data?.error;
      try {
        const fresh = await timetableAPI.get(filterParams());
        const grouped2 = fresh.data?.grouped || {};
        setGrouped(grouped2);
        setTotalSlots(fresh.data?.total || 0);
        const confirmed = moves.filter((m) =>
          Object.values(grouped2).some((grp) =>
            grp.slots.some(
              (s) =>
                s.id === m.id &&
                s.day === m.day &&
                s.startTime === m.startTime &&
                s.endTime === m.endTime
            )
          )
        );
        const remaining = moves.filter((m) => !confirmed.includes(m));
        setPendingMoves((prev) => {
          const next = { ...prev };
          confirmed.forEach((m) => delete next[m.id]);
          return next;
        });
        if (remaining.length === 0) {
          toast.success(`${confirmed.length} change${confirmed.length === 1 ? '' : 's'} saved`);
          return;
        }
        toast.error(serverMsg || `${remaining.length} change${remaining.length === 1 ? '' : 's'} could not be saved`);
      } catch (_) {
        toast.error(serverMsg || 'Failed to save changes');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDiscardMoves = () => {
    if (unsavedCount === 0) return;
    setPendingMoves({});
    toast('Unsaved changes discarded');
  };

  return (
    <Layout>
      <div className="tv-header no-print">
        <div className="tv-header-left">
          <h1 className="tv-title">
            {activeGroup || 'Timetable Viewer'}
          </h1>
          <p className="tv-subtitle">
            {totalSlots > 0
              ? isAdmin
                ? `${totalSlots} scheduled classes across ${groupKeys.length} group${groupKeys.length !== 1 ? 's' : ''}`
                : `${totalSlots} classes you teach across ${groupKeys.length} group${groupKeys.length !== 1 ? 's' : ''}`
              : isAdmin
                ? 'No timetable data — generate one from the Generator page'
                : 'No classes assigned to you yet'}
          </p>
          <div className="tv-header-meta">
            <span className="tv-status-badge">
              <span className="tv-status-dot" />
              {totalSlots > 0 ? 'Active' : 'Empty'}
            </span>
            <span className="tv-meta-item">
              <BookOpen size={13} />
              {countClasses()} classes / week
            </span>
            <span className="tv-meta-item">
              <Clock size={13} />
              10 periods · 08:00 – 18:55
            </span>
          </div>
        </div>
        <div className="tv-header-actions">
          <button className="btn btn-ghost btn-sm" onClick={() => setShowFilters(!showFilters)}>
            <Filter size={14} />
            {showFilters ? 'Hide Filters' : 'Filters'}
          </button>
<button className="btn btn-ghost btn-sm" onClick={handlePrint}>
              <Printer size={14} />
              Print
            </button>
            <button className="btn btn-primary btn-sm" onClick={handleExportPDF}>
              <FileDown size={14} />
              Export / Print
            </button>
            {unsavedCount > 0 && isAdmin && (
            <>
              <button className="btn btn-ghost btn-sm" onClick={handleDiscardMoves}>
                <RotateCcw size={14} />
                Discard
              </button>
              <button className="btn btn-success btn-sm" onClick={handleSaveMoves} disabled={saving}>
                <Save size={14} />
                {saving ? 'Saving…' : `Save ${unsavedCount} change${unsavedCount !== 1 ? 's' : ''}`}
              </button>
            </>
          )}
          <button className="btn btn-ghost btn-sm" onClick={handleExportASCII}>
            <FileText size={14} />
            Export Text
          </button>
          <button className="btn btn-ghost btn-sm" onClick={handleExportJSON}>
            <FileJson size={14} />
            Export JSON
          </button>
        </div>
      </div>

      <div className={`tv-layout ${!showFilters ? 'tv-layout-full' : ''}`}>
        {showFilters && (
          <div className="tv-sidebar no-print">
            <div className="tv-sidebar-header">
              <h3>Filters</h3>
              <button className="tv-sidebar-close" onClick={() => setShowFilters(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="tv-filter-section">
              <h4>Academic Year</h4>
              <select
                className="form-select"
                value={selYear}
                onChange={(e) => setSelYear(e.target.value)}
              >
                <option value="">All Years</option>
                {years.map((y) => (
                  <option key={y.id} value={y.id}>{y.name}</option>
                ))}
              </select>
            </div>

            <div className="tv-filter-section">
              <h4>Semester</h4>
              <select
                className="form-select"
                value={selSemester}
                onChange={(e) => setSelSemester(e.target.value)}
              >
                <option value="">All Semesters</option>
                {semesters.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="tv-filter-section">
              <h4>Programme</h4>
              <select
                className="form-select"
                value={selProgram}
                onChange={(e) => setSelProgram(e.target.value)}
              >
                <option value="">All Programmes</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="tv-filter-section">
              <h4>Academic Level</h4>
              <select
                className="form-select"
                value={selLevel}
                onChange={(e) => setSelLevel(e.target.value)}
              >
                <option value="">All Levels</option>
                {levels.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>

            <button
              className="btn btn-primary btn-sm"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={loadTimetable}
            >
              Apply Filters
            </button>
          </div>
        )}

        <div className="tv-grid-container">
          {loading ? (
            <div className="empty-state">
              <Loader2 size={32} className="spin" />
              <p>Loading timetable...</p>
            </div>
          ) : groupKeys.length === 0 ? (
            <div className="empty-state">
              <BookOpen size={40} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.3rem' }}>No Timetable Found</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {isAdmin
                  ? 'Go to Generator to create one, or adjust your filters.'
                  : 'No classes assigned to you yet. If you expect to teach some, reach out via Chat with Admin.'}
              </p>
            </div>
          ) : (
            <>
              {groupKeys.length > 1 && (
                <div className="tv-group-tabs no-print">
                  {groupKeys.map((key) => (
                    <button
                      key={key}
                      className={`tv-group-tab ${activeGroup === key ? 'active' : ''}`}
                      onClick={() => setActiveGroup(key)}
                    >
                      {key}
                    </button>
                  ))}
                </div>
              )}

              <div className="tv-grid-wrapper print-grid">
                <div className="tv-print-header print-only">
                  <h2>{activeGroup}</h2>
                  <p>Weekly Class Timetable — {totalSlots} classes</p>
                </div>
                {grid && (
                  <div className="tv-v-grid">
                    <div className="tv-v-header-row">
                      <div className="tv-v-corner">
                        <div className="tv-v-corner-day">Day</div>
                      </div>
                      {PERIODS.map((p) => (
                        <div key={p.num} className="tv-v-period-header" style={{ flex: 1 }}>
                          <span className="tv-v-period-label">{p.label}</span>
                          <span className="tv-v-period-time">{p.start} – {p.end}</span>
                        </div>
                      ))}
                    </div>

                    {DAY_KEYS.map((day) => {
                      const daySlots = grid[day];
                      const rendered = [];
                      let pi = 0;
                      while (pi < 10) {
                        const cell = daySlots[pi];
                        if (cell) {
                          rendered.push({ type: 'class', cell, startP: pi, span: cell.span || 1 });
                          pi += cell.span || 1;
                        } else {
                          let run = 1;
                          while (pi + run < 10 && !daySlots[pi + run]) run++;
                          rendered.push({ type: 'free', startP: pi, span: run });
                          pi += run;
                        }
                      }

                      const over = dropTarget && dragInfo && dropTarget.day === day;
                      const hoverPeriod = over ? dropTarget.period : null;

                      return (
                        <div key={day} className={`tv-v-row ${over ? 'tv-v-dragover' : ''}`}>
                          <div className="tv-v-day-label">{day}</div>
                          <div
                            className="tv-v-row-cells"
                            onDragOver={(e) => handleRowDragOver(e, day)}
                            onDrop={(e) => handleRowDrop(e, day)}
                          >
                            {rendered.map((item) => {
                              if (item.type === 'free') {
                                const active =
                                  hoverPeriod !== null &&
                                  hoverPeriod >= item.startP + 1 &&
                                  hoverPeriod <= item.startP + item.span;
                                return (
                                  <div
                                    key={`${day}-free-${item.startP}`}
                                    className={`tv-v-cell tv-v-cell-empty ${active ? 'tv-v-cell-drop' : ''}`}
                                    style={{ flex: item.span }}
                                  >
                                    <span className="tv-v-free">—</span>
                                  </div>
                                );
                              }
                              const c = item.cell;
                              const tc = getTypeColor(c.courseType);
                              const isDragging = dragInfo && dragInfo.id === c.id;
                              return (
                                <div
                                  key={`${day}-${item.startP}`}
                                  draggable={isAdmin}
                                  onDragStart={(e) => handleCellDragStart(e, c, day, item.startP)}
                                  onDragEnd={() => { setDropTarget(null); setDragInfo(null); }}
                                  className={`tv-v-cell ${isDragging ? 'tv-v-cell-drag' : ''}`}
                                  style={{
                                    flex: item.span,
                                    background: tc.bg,
                                    borderLeft: `3px solid ${tc.border}`,
                                  }}
                                >
                                  <div className="tv-v-cell-top">
                                    <span className="tv-v-cell-code" style={{ color: tc.text }}>
                                      {c.courseCode}
                                    </span>
                                    <span
                                      className="tv-v-cell-type"
                                      style={{ background: tc.badge, color: '#fff' }}
                                    >
                                      {c.courseType || 'Lecture'}
                                    </span>
                                  </div>
                                  {c.courseName && (
                                    <div className="tv-v-cell-name">{c.courseName}</div>
                                  )}
                                  <div className="tv-v-cell-meta">
                                    {c.room && (
                                      <span className="tv-v-cell-room">{c.room}</span>
                                    )}
                                    {c.lecturer && (
                                      <span className="tv-v-cell-instructor">{c.lecturer}</span>
                                    )}
                                    <span className="tv-v-cell-periods">
                                      P{c.startPeriod}–P{c.endPeriod}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="tv-legend no-print">
                <span className="tv-legend-title">Class Types:</span>
                <span className="tv-legend-item">
                  <span className="tv-legend-dot" style={{ background: TYPE_COLORS.lecture.badge }} />
                  Lecture
                </span>
                <span className="tv-legend-item">
                  <span className="tv-legend-dot" style={{ background: TYPE_COLORS.lab.badge }} />
                  Lab
                </span>
                <span className="tv-legend-item">
                  <span className="tv-legend-dot" style={{ background: TYPE_COLORS.default.badge }} />
                  Other
                </span>
                <span className="tv-legend-tip">
                  {isAdmin
                    ? 'Tip: drag classes to rearrange freely, then press Save to apply all changes at once'
                    : 'Read-only view — request changes via Chat with Admin'}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
