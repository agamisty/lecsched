import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState('admin');

  const demoAccounts = {
    admin: { email: 'admin@lecsched.app', password: 'pass123', label: 'Administrator / Examiner' },
    lecturer: { email: 'staff.opv@lecsched.app', password: 'pass123', label: 'Lecturer (staff account)' },
  };

  const switchRole = (r) => {
    setRole(r);
    setForm({ email: '', password: '' });
  };

  const fillDemo = (r) => {
    setRole(r);
    setForm({ ...demoAccounts[r] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login(form.email, form.password);
      navigate(data.user?.role === 'admin' ? '/' : '/viewer');
      toast.success(data.user?.role === 'admin' ? 'Logged in as Administrator' : 'Logged in as Lecturer');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-status">LECSCHED · All Engines Operational</div>
      <div className="login-card">
        <div className="login-logo">
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <Logo style={{ width: '90%', maxWidth: 500 }} />
          </div>
        </div>
        <div className="login-role-toggle">
          <button type="button" className={role === 'admin' ? 'active' : ''} onClick={() => switchRole('admin')}>
            Administrator
          </button>
          <button type="button" className={role === 'lecturer' ? 'active' : ''} onClick={() => switchRole('lecturer')}>
            Lecturer
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{role === 'admin' ? 'Administrator Email' : 'Lecturer Email'}</label>
            <input
              type="email"
              required
              placeholder={role === 'admin' ? 'admin@university.edu' : 'staff.<dept>@lecsched.app'}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <div className="login-pw-field">
              <input
                type={showPw ? 'text' : 'password'}
                required
                placeholder="Enter your password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <button type="button" className="pw-toggle" onClick={() => setShowPw(!showPw)}>
                {showPw ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          <div className="login-demo">
            <span className="login-demo-title">Demo accounts</span>
            <div className="login-demo-row">
              <button type="button" onClick={() => fillDemo('admin')}>Fill administrator</button>
              <button type="button" onClick={() => fillDemo('lecturer')}>Fill lecturer</button>
            </div>
            <div className="login-demo-cred">
              {demoAccounts[role].label}: <code>{demoAccounts[role].email}</code> / <code>{demoAccounts[role].password}</code>
            </div>
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', marginTop: '1rem' }}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <div className="login-secondary">
          <button>SSO Login</button>
          <button>Help Desk</button>
        </div>
        <div className="login-footer">
          <span>&copy; 2026 Lecsched. Privacy Policy · Terms of Service</span>
          <span>v2.4.1 · <a>Contact System Administrator</a></span>
        </div>
      </div>
    </div>
  );
}
