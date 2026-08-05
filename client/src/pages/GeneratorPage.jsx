import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { timetableAPI, academicYearsAPI, semestersAPI, facultiesAPI, departmentsAPI } from '../services/api';
import {
  Settings,
  Play,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronDown,
  Zap,
  Loader2,
  Landmark,
  Building2,
} from 'lucide-react';

export default function GeneratorPage() {
  const navigate = useNavigate();

  const [years, setYears] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [selYear, setSelYear] = useState('');
  const [selSemester, setSelSemester] = useState('');
  const [selFaculty, setSelFaculty] = useState('');
  const [selDepartment, setSelDepartment] = useState('');

  const [generating, setGenerating] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  useEffect(() => {
    academicYearsAPI.list().then((r) => {
      const y = r.data.years || r.data || [];
      setYears(y);
      const current = y.find((yr) => yr.isCurrent);
      if (current) setSelYear(String(current.id));
    }).catch(() => {});
    facultiesAPI.list().then((r) => {
      setFaculties(r.data.faculties || r.data || []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (selYear) {
      semestersAPI.list({ academicYearId: selYear }).then((r) => {
        const s = r.data.semesters || r.data || [];
        setSemesters(s);
        const current = s.find((sm) => sm.isCurrent);
        if (current) setSelSemester(String(current.id));
        else if (s.length > 0) setSelSemester(String(s[0].id));
        else setSelSemester('');
      }).catch(() => {});
    } else {
      setSemesters([]);
      setSelSemester('');
    }
  }, [selYear]);

  useEffect(() => {
    if (selFaculty) {
      departmentsAPI.list({ facultyId: selFaculty }).then((r) => {
        setDepartments(r.data.departments || r.data || []);
      }).catch(() => {});
    } else {
      departmentsAPI.list().then((r) => {
        setDepartments(r.data.departments || r.data || []);
      }).catch(() => {});
    }
    setSelDepartment('');
  }, [selFaculty]);

  const canGenerate = selYear && selSemester;

  const handleGenerate = async () => {
    if (!selSemester) {
      toast.error('Please select a semester');
      return;
    }
    setGenerating(true);
    setLastResult(null);
    try {
      const payload = {
        academicYearId: Number(selYear),
        semesterId: Number(selSemester),
      };
      if (selFaculty) payload.facultyId = Number(selFaculty);
      if (selDepartment) payload.departmentId = Number(selDepartment);

      const res = await timetableAPI.generate(payload);
      if (res.data.success) {
        setLastResult(res.data);
        toast.success(`Generated ${res.data.placedCount} class slots`);
        if (res.data.clashes?.length > 0) {
          toast.error(`${res.data.clashes.length} course(s) could not be placed`);
        }
      } else {
        toast.error(res.data.error || 'Generation failed');
        setLastResult({ error: res.data.error });
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Error generating timetable';
      toast.error(msg);
      setLastResult({ error: msg });
    }
    setGenerating(false);
  };

  return (
    <Layout>
      <div className="gen-header">
        <div className="gen-header-left">
          <h1 className="gen-title">Timetable Generator</h1>
          <p className="gen-subtitle">Select semester and optional filters, then generate</p>
        </div>
      </div>

      <div className="gen-layout">
        <div className="gen-config-panel">
          <div className="gen-card">
            <div className="gen-card-header">
              <Settings size={16} />
              <h3>Generation Configuration</h3>
            </div>

            <div className="gen-form-row">
              <div className="gen-form-group">
                <label>Academic Year <span style={{ color: 'var(--danger)' }}>*</span></label>
                <div className="gen-select-wrap">
                  <select value={selYear} onChange={(e) => setSelYear(e.target.value)}>
                    <option value="">Select Year</option>
                    {years.map((y) => (
                      <option key={y.id} value={y.id}>{y.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="gen-select-icon" />
                </div>
              </div>
              <div className="gen-form-group">
                <label>Semester <span style={{ color: 'var(--danger)' }}>*</span></label>
                <div className="gen-select-wrap">
                  <select value={selSemester} onChange={(e) => setSelSemester(e.target.value)}>
                    <option value="">Select Semester</option>
                    {semesters.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="gen-select-icon" />
                </div>
              </div>
            </div>

            <div className="gen-form-row">
              <div className="gen-form-group">
                <label>
                  <Landmark size={13} style={{ verticalAlign: '-2px', marginRight: '0.3rem' }} />
                  Faculty (optional)
                </label>
                <div className="gen-select-wrap">
                  <select value={selFaculty} onChange={(e) => setSelFaculty(e.target.value)}>
                    <option value="">All Faculties</option>
                    {faculties.map((f) => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="gen-select-icon" />
                </div>
              </div>
              <div className="gen-form-group">
                <label>
                  <Building2 size={13} style={{ verticalAlign: '-2px', marginRight: '0.3rem' }} />
                  Department (optional)
                </label>
                <div className="gen-select-wrap">
                  <select value={selDepartment} onChange={(e) => setSelDepartment(e.target.value)}>
                    <option value="">All Departments</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="gen-select-icon" />
                </div>
              </div>
            </div>
          </div>

          <button
            className="gen-run-btn"
            onClick={handleGenerate}
            disabled={generating || !canGenerate}
            style={{ opacity: canGenerate ? 1 : 0.5 }}
          >
            {generating ? (
              <>
                <Loader2 size={18} className="spin" />
                Generating Timetable...
              </>
            ) : (
              <>
                <Play size={18} />
                Generate Timetable
              </>
            )}
          </button>

          {lastResult && !lastResult.error && (
            <div className="gen-card" style={{ marginTop: '1rem', borderLeft: '3px solid var(--success)' }}>
              <div className="gen-card-header">
                <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />
                <h3>Generation Complete</h3>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                <p><strong>{lastResult.placedCount}</strong> class slots placed out of <strong>{lastResult.totalOfferings}</strong> offerings</p>
                {lastResult.groups?.length > 0 && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Groups generated:</p>
                    {lastResult.groups.map((g, i) => (
                      <p key={i} style={{ paddingLeft: '0.75rem' }}>
                        {g.programme} — Level {g.level} ({g.courseCount} courses)
                      </p>
                    ))}
                  </div>
                )}
                {lastResult.clashes?.length > 0 && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <p style={{ fontWeight: 600, color: 'var(--danger)', marginBottom: '0.25rem' }}>
                      <AlertTriangle size={13} style={{ verticalAlign: '-2px' }} /> Unplaced courses:
                    </p>
                    {lastResult.clashes.map((c, i) => (
                      <p key={i} style={{ paddingLeft: '0.75rem', fontSize: '0.82rem' }}>
                        {c.courseCode} — {c.reason}
                      </p>
                    ))}
                  </div>
                )}
                <button
                  className="btn btn-primary btn-sm"
                  style={{ marginTop: '0.75rem' }}
                  onClick={() => navigate('/viewer')}
                >
                  View Timetable →
                </button>
              </div>
            </div>
          )}

          {lastResult?.error && (
            <div className="gen-card" style={{ marginTop: '1rem', borderLeft: '3px solid var(--danger)' }}>
              <div className="gen-card-header">
                <XCircle size={16} style={{ color: 'var(--danger)' }} />
                <h3>Generation Failed</h3>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{lastResult.error}</p>
            </div>
          )}
        </div>

        <div className="gen-right-panel">
          <div className="gen-tip">
            <Zap size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
            <p>Select a semester first. The algorithm groups courses by programme and academic level, then assigns time slots and rooms while avoiding lecturer and room conflicts.</p>
          </div>
          <div className="gen-tip">
            <Clock size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
            <p>Filtering by faculty or department limits which course offerings are included in the generation.</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
