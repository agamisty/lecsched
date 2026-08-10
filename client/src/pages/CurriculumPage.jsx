import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { programsAPI, academicLevelsAPI, curriculumAPI, coursesAPI, semestersAPI, lecturersAPI } from '../services/api';
import {
  Search, Bell, Plus, ChevronDown, ChevronLeft, ChevronRight, X, BookCopy, Edit3, Trash2, Info, GraduationCap,
} from 'lucide-react';

export default function CurriculumPage() {
  const [programs, setPrograms] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState('');
  const [levels, setLevels] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [offerings, setOfferings] = useState([]);
  const [search, setSearch] = useState('');
  const [allCourses, setAllCourses] = useState([]);
  const [allSemesters, setAllSemesters] = useState([]);
  const [allLecturers, setAllLecturers] = useState([]);
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [showOfferingModal, setShowOfferingModal] = useState(false);
  const [levelForm, setLevelForm] = useState({ level: '', name: '' });
  const [offeringForm, setOfferingForm] = useState({ courseId: '', semesterId: '', lecturerId: '', numStudents: '', levelId: '' });
  const [submitting, setSubmitting] = useState(false);

  const loadPrograms = async () => { try { const res = await programsAPI.list(); setPrograms(res.data); } catch {} };
  const loadMeta = async () => {
    try {
      const [c, s, l] = await Promise.all([coursesAPI.list(), semestersAPI.list(), lecturersAPI.list()]);
      setAllCourses(c.data); setAllSemesters(s.data); setAllLecturers(l.data);
    } catch {}
  };

  useEffect(() => { loadPrograms(); loadMeta(); }, []);

  const loadLevels = async (progId) => {
    if (!progId) { setLevels([]); setSelectedLevel(null); setOfferings([]); return; }
    try {
      const res = await academicLevelsAPI.list({ programId: progId });
      setLevels(res.data); setSelectedLevel(null); setOfferings([]);
    } catch {}
  };

  useEffect(() => { if (selectedProgram) loadLevels(selectedProgram); }, [selectedProgram]);

  const loadOfferings = async (levelId) => {
    if (!levelId) { setOfferings([]); return; }
    try {
      const res = await curriculumAPI.list({ academicLevelId: levelId });
      setOfferings(res.data);
    } catch {}
  };

  const handleAddLevel = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try {
      await academicLevelsAPI.create({ programId: selectedProgram, level: Number(levelForm.level), name: levelForm.name || `Level ${levelForm.level}` });
      toast.success('Level added'); setShowLevelModal(false); setLevelForm({ level: '', name: '' }); loadLevels(selectedProgram);
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
    finally { setSubmitting(false); }
  };

  const handleAddOffering = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try {
      const levelId = Number(offeringForm.levelId) || selectedLevel?.id;
      const level = levels.find((l) => l.id === levelId);
      if (!level) { toast.error('Select a year for this offering'); return; }
      await curriculumAPI.create({ ...offeringForm, levelId: undefined, academicLevelId: levelId, numStudents: Number(offeringForm.numStudents) || 0 });
      toast.success('Course offering added'); setShowOfferingModal(false); setOfferingForm({ courseId: '', semesterId: '', lecturerId: '', numStudents: '', levelId: '' });
      setSelectedLevel(level);
      loadOfferings(levelId);
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
    finally { setSubmitting(false); }
  };

  const handleDeleteOffering = async (id) => {
    if (!confirm('Remove this course offering?')) return;
    try { await curriculumAPI.delete(id); toast.success('Removed'); loadOfferings(selectedLevel.id); } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const programObj = programs.find(p => String(p.id) === String(selectedProgram));

  const filteredOfferings = offerings.filter(o => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (o.course?.code || '').toLowerCase().includes(q) ||
      (o.course?.name || '').toLowerCase().includes(q) ||
      (o.lecturer?.name || '').toLowerCase().includes(q);
  });

  return (
    <Layout>
      <div className="dash-topbar">
        <div className="dash-search"><Search size={15} color="var(--text-light)" /><input type="text" placeholder="Search curriculum..." value={search} onChange={e => setSearch(e.target.value)} /></div>
        <div className="dash-topbar-right"><button className="dash-notif-btn"><Bell size={18} /><span className="dash-notif-dot" /></button><div className="dash-divider" /><div className="dash-admin"><div className="dash-avatar-img" style={{ borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>AU</div><div className="dash-admin-info"><span className="dash-admin-name">Admin User</span><span className="dash-admin-role">University Admin</span></div></div></div>
      </div>
      <div className="co-breadcrumb"><a href="#">Dashboard</a><span className="co-breadcrumb-sep">/</span><span className="co-breadcrumb-current">Curriculum</span></div>
      <div className="co-header"><div className="co-header-left"><h1 className="co-title">Curriculum / Programme Structure</h1><p className="co-subtitle">Define and manage the complete academic structure for each programme.</p></div></div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1rem', marginTop: '1rem' }}>
        {/* Left: Programme + Levels */}
        <div className="co-table-card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem' }}>Select Programme</h3>
          <div className="cr-modal-select-wrap" style={{ marginBottom: '1rem' }}>
            <select value={selectedProgram} onChange={e => setSelectedProgram(e.target.value)} style={{ width: '100%', padding: '0.7rem 2.2rem 0.7rem 0.85rem', border: '1px solid #e6e9ee', borderRadius: '8px', fontSize: '0.88rem', fontFamily: 'inherit', appearance: 'none', background: 'var(--bg-card)' }}>
              <option value="">Choose programme...</option>
              {programs.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
            </select>
            <ChevronDown size={14} className="cr-modal-select-icon" />
          </div>

          {levels.length > 0 && (
            <>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem' }}>Academic Levels</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.75rem' }}>
                {levels.map(l => (
                  <button key={l.id} onClick={() => { setSelectedLevel(l); loadOfferings(l.id); }}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.65rem 0.85rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: selectedLevel?.id === l.id ? 600 : 500, color: selectedLevel?.id === l.id ? 'var(--accent)' : 'var(--text-secondary)', background: selectedLevel?.id === l.id ? '#e8f4ff' : 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', width: '100%' }}>
                    <GraduationCap size={16} />
                    <span>{l.name} ({l.level})</span>
                    <span style={{ marginLeft: 'auto', fontSize: '0.72rem', background: '#e8f4ff', color: '#4facfe', padding: '0.1rem 0.5rem', borderRadius: '10px' }}>{l.offerings?.length || 0} courses</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {selectedProgram && (
            <button className="btn btn-primary btn-sm" style={{ width: '100%' }} onClick={() => { setLevelForm({ level: '', name: '' }); setShowLevelModal(true); }}>
              <Plus size={14} /> Add Level
            </button>
          )}
        </div>

        {/* Right: Course Offerings */}
        <div className="co-table-card">
          {selectedLevel ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>{programObj?.name} — {selectedLevel.name}</h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{search ? `${filteredOfferings.length} of ${offerings.length} course offerings` : `${offerings.length} course offerings`}</p>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => { setOfferingForm({ courseId: '', semesterId: '', lecturerId: '', numStudents: '', levelId: selectedLevel.id }); setShowOfferingModal(true); }}><Plus size={14} /> Add Course</button>
              </div>
              <div className="co-table-wrap">
                <div className="cr-table-header" style={{ gridTemplateColumns: '0.8fr 1.5fr 1fr 0.7fr 1fr 0.7fr 0.7fr' }}>
                  <span>Code</span><span>Course</span><span>Semester</span><span>Credits</span><span>Lecturer</span><span>Students</span><span>Actions</span>
                </div>
                {filteredOfferings.map(o => (
                  <div key={o.id} className="cr-table-row" style={{ gridTemplateColumns: '0.8fr 1.5fr 1fr 0.7fr 1fr 0.7fr 0.7fr' }}>
                    <span style={{ fontWeight: 600, fontFamily: 'monospace', color: 'var(--accent)', fontSize: '0.85rem' }}>{o.course?.code}</span>
                    <span style={{ fontSize: '0.85rem' }}>{o.course?.name}</span>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{o.semester?.name}</span>
                    <span style={{ fontSize: '0.82rem' }}>{o.course?.creditHours}</span>
                    <span style={{ fontSize: '0.82rem' }}>{o.lecturer?.name || '—'}</span>
                    <span style={{ fontSize: '0.82rem' }}>{o.numStudents}</span>
                    <div className="cr-td-actions"><button className="co-action-btn co-action-danger" onClick={() => handleDeleteOffering(o.id)}><Trash2 size={14} /></button></div>
                  </div>
                ))}
                {filteredOfferings.length === 0 && <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>{offerings.length === 0 ? 'No courses offered at this level' : 'No courses match your search'}</div>}
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '300px', color: 'var(--text-muted)' }}>
              <BookCopy size={40} style={{ marginBottom: '0.75rem', opacity: 0.4 }} />
              <p style={{ fontSize: '0.92rem' }}>Select a programme and level to view its curriculum</p>
            </div>
          )}
        </div>
      </div>
      <div className="dash-footer" style={{ marginTop: '1rem' }}>© 2024 Automated Timetable Generation System · University Administration Portal · v1.0.2</div>

      {/* Add Level Modal */}
      {showLevelModal && (
        <div className="cr-modal-overlay" onClick={() => setShowLevelModal(false)}>
          <div className="cr-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="cr-modal-banner"><div className="cr-modal-banner-left"><div className="cr-modal-banner-icon"><GraduationCap size={16} /></div><div><h2>Add Academic Level</h2><p>Add a new level to this programme.</p></div></div><button className="cr-modal-close" onClick={() => setShowLevelModal(false)}><X size={16} /></button></div>
            <form onSubmit={handleAddLevel} className="cr-modal-form">
              <div className="cr-modal-row-2">
                <div className="cr-modal-field"><label>Level Number</label><input required type="number" min="100" max="900" step="100" placeholder="e.g. 100" value={levelForm.level} onChange={e => setLevelForm({ ...levelForm, level: e.target.value })} /></div>
                <div className="cr-modal-field"><label>Level Name</label><input placeholder="e.g. Level 100" value={levelForm.name} onChange={e => setLevelForm({ ...levelForm, name: e.target.value })} /></div>
              </div>
              <div className="cr-modal-actions">
                <button type="button" className="cr-modal-btn cr-modal-btn-cancel" onClick={() => setShowLevelModal(false)}>Cancel</button>
                <button type="submit" className="cr-modal-btn cr-modal-btn-submit" disabled={submitting}>{submitting ? 'Adding...' : 'Add Level'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Offering Modal */}
      {showOfferingModal && (
        <div className="cr-modal-overlay" onClick={() => setShowOfferingModal(false)}>
          <div className="cr-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '560px' }}>
            <div className="cr-modal-banner"><div className="cr-modal-banner-left"><div className="cr-modal-banner-icon"><BookCopy size={16} /></div><div><h2>Add Course Offering</h2><p>Select the year this course belongs to, then assign the course and semester.</p></div></div><button className="cr-modal-close" onClick={() => setShowOfferingModal(false)}><X size={16} /></button></div>
            <form onSubmit={handleAddOffering} className="cr-modal-form">
              <div className="cr-modal-field"><label>Year (Level)</label><div className="cr-modal-select-wrap"><select required value={offeringForm.levelId} onChange={e => setOfferingForm({ ...offeringForm, levelId: e.target.value })}><option value="">Select year...</option>{levels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</select><ChevronDown size={14} className="cr-modal-select-icon" /></div></div>
              <div className="cr-modal-field"><label>Course</label><div className="cr-modal-select-wrap"><select required value={offeringForm.courseId} onChange={e => setOfferingForm({ ...offeringForm, courseId: e.target.value })}><option value="">Select course...</option>{allCourses.map(c => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}</select><ChevronDown size={14} className="cr-modal-select-icon" /></div></div>
              <div className="cr-modal-row-2">
                <div className="cr-modal-field"><label>Semester</label><div className="cr-modal-select-wrap"><select required value={offeringForm.semesterId} onChange={e => setOfferingForm({ ...offeringForm, semesterId: e.target.value })}><option value="">Select semester...</option>{allSemesters.map(s => <option key={s.id} value={s.id}>{s.name} ({s.academicYear?.name})</option>)}</select><ChevronDown size={14} className="cr-modal-select-icon" /></div></div>
                <div className="cr-modal-field"><label>Lecturer</label><div className="cr-modal-select-wrap"><select value={offeringForm.lecturerId} onChange={e => setOfferingForm({ ...offeringForm, lecturerId: e.target.value })}><option value="">Select lecturer...</option>{allLecturers.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</select><ChevronDown size={14} className="cr-modal-select-icon" /></div></div>
              </div>
              <div className="cr-modal-field"><label>Number of Students</label><input type="number" min="0" placeholder="e.g. 60" value={offeringForm.numStudents} onChange={e => setOfferingForm({ ...offeringForm, numStudents: e.target.value })} /></div>
              <div className="cr-modal-actions">
                <button type="button" className="cr-modal-btn cr-modal-btn-cancel" onClick={() => setShowOfferingModal(false)}>Cancel</button>
                <button type="submit" className="cr-modal-btn cr-modal-btn-submit" disabled={submitting}>{submitting ? 'Adding...' : 'Add Offering'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
