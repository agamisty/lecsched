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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/');
      toast.success('Logged in');
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
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Administrator Email</label>
            <input
              type="email"
              required
              placeholder="admin@university.edu"
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
          <div className="forgot-link">
            <a>Forgot password?</a>
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', marginTop: '1rem' }}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In to Portal'}
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
