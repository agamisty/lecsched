import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import {
  Bell,
  User,
  Shield,
  Palette,
  Key,
  Calendar,
  HelpCircle,
  Camera,
  X,
  Lock,
  Smartphone,
  ChevronDown,
  RotateCcw,
  Save,
  Settings,
  LogOut,
  Sun,
  Moon,
  Layers,
  Check,
} from 'lucide-react';

const SETTINGS_NAV = [
  { id: 'profile', label: 'Account Profile', icon: User },
  { id: 'periods', label: 'Academic Periods', icon: Calendar },
  { id: 'branding', label: 'University Branding', icon: Palette },
  { id: 'roles', label: 'Roles & Permissions', icon: Shield },
  { id: 'prefs', label: 'System Preferences', icon: Settings },
];

const THEMES = [
  { id: 'default', label: 'Default', desc: 'Warm, comfortable tones', icon: Layers, preview: 'linear-gradient(135deg, #c0873a, #e8c99b)' },
  { id: 'light', label: 'Light', desc: 'Clean white interface', icon: Sun, preview: 'linear-gradient(135deg, #2563eb, #a8d8ff)' },
  { id: 'dark', label: 'Dark', desc: 'Easy on the eyes', icon: Moon, preview: 'linear-gradient(135deg, #1a1a2e, #4a4a6e)' },
];

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const [activeNav, setActiveNav] = useState('profile');
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'default');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [hasChanges, setHasChanges] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' });
  const avatarInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      const parts = (user.name || '').split(' ');
      setFirstName(parts[0] || '');
      setLastName(parts.slice(1).join(' ') || '');
      setEmail(user.email || '');
      setAvatar(user.avatar || '');
    }
  }, [user]);

  const applyTheme = (id) => {
    setTheme(id);
    document.documentElement.setAttribute('data-theme', id);
    localStorage.setItem('theme', id);
    toast.success(`Switched to ${THEMES.find((t) => t.id === id).label} theme`);
  };

  const handleFieldChange = (setter) => (e) => {
    setter(e.target.value);
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const res = await authAPI.updateProfile({
        name: [firstName, lastName].filter(Boolean).join(' '),
        email,
        avatar,
      });
      if (res.data) updateUser(res.data);
      setHasChanges(false);
      toast.success('Settings saved successfully');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = new Image();
    img.onload = () => {
      const MAX = 512;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        const ratio = Math.min(MAX / width, MAX / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      try {
        const resized = canvas.toDataURL('image/jpeg', 0.85);
        setAvatar(resized);
        setHasChanges(true);
      } catch {
        toast.error('Could not process this image');
      }
    };
    img.onerror = () => toast.error('Could not load this image');
    img.src = URL.createObjectURL(file);
    e.target.value = '';
  };

  const handleAvatarRemove = () => {
    setAvatar('');
    setHasChanges(true);
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (pwd.next !== pwd.confirm) {
      toast.error('New passwords do not match');
      return;
    }
    if (!pwd.next || pwd.next.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setSaving(true);
    try {
      await authAPI.updateProfile({ currentPassword: pwd.current, password: pwd.next });
      toast.success('Password updated successfully');
      setShowPasswordModal(false);
      setPwd({ current: '', next: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setAvatar(user?.avatar || '');
    setHasChanges(false);
    toast.success('Changes reset');
  };

  return (
    <Layout>
      {/* Topbar */}
      <div className="dash-topbar">
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
        <span className="co-breadcrumb-current">Settings</span>
      </div>

      {/* Header */}
      <div className="co-header">
        <div className="co-header-left">
          <h1 className="co-title">System Settings</h1>
          <p className="co-subtitle">Manage your account, preferences, and system-wide configurations.</p>
        </div>
      </div>

      {/* Two-column Layout */}
      <div className="set-layout">
        {/* Left Column — Settings Nav */}
        <div className="set-left-col">
          <div className="set-nav-card">
            <div className="set-nav-items">
              {SETTINGS_NAV.map((item) => {
                const Icon = item.icon;
                const isActive = activeNav === item.id;
                return (
                  <button
                    key={item.id}
                    className={`set-nav-item ${isActive ? 'set-nav-active' : ''}`}
                    onClick={() => setActiveNav(item.id)}
                  >
                    <Icon size={16} />
                    <span>{item.label}</span>
                    {isActive && <span className="set-nav-indicator" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Help Box */}
          <div className="set-help-box">
            <div className="set-help-icon">
              <HelpCircle size={18} />
            </div>
            <div>
              <h4 className="set-help-title">Need Help?</h4>
              <p className="set-help-desc">Contact the IT support team or visit the documentation portal for guidance on system settings.</p>
            </div>
          </div>
        </div>

        {/* Right Column — Content Cards */}
        <div className="set-right-col">
          {/* Theme Card */}
          <div className="set-card">
            <div className="set-card-header">
              <h3 className="set-card-title">Theme</h3>
              <p className="set-card-sub">Select your preferred interface appearance</p>
            </div>
            <div className="set-theme-grid">
              {THEMES.map((t) => {
                const Icon = t.icon;
                const isActive = theme === t.id;
                return (
                  <button
                    key={t.id}
                    className={`set-theme-option ${isActive ? 'set-theme-active' : ''}`}
                    onClick={() => applyTheme(t.id)}
                  >
                    <div className="set-theme-preview" style={{ background: t.preview }}>
                      <Icon size={20} color="#fff" />
                    </div>
                    <div className="set-theme-info">
                      <span className="set-theme-label">{t.label}</span>
                      <span className="set-theme-desc">{t.desc}</span>
                    </div>
                    {isActive && (
                      <div className="set-theme-check">
                        <Check size={14} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Public Profile Card */}
          <div className="set-card">
            <div className="set-card-header">
              <h3 className="set-card-title">Public Profile</h3>
              <p className="set-card-sub">This information will be displayed publicly</p>
            </div>

            {/* Avatar Row */}
            <div className="set-avatar-row">
              <div className="set-avatar-circle" style={{ overflow: 'hidden' }}>
                {avatar ? (
                  <img src={avatar} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                ) : (
                  <span>{(user?.name || 'AU').split(' ').map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()}</span>
                )}
              </div>
              <div className="set-avatar-actions">
                <button className="set-btn set-btn-blue" onClick={() => avatarInputRef.current?.click()}>
                  <Camera size={14} />
                  Change Photo
                </button>
                <button className="set-btn set-btn-outline" onClick={handleAvatarRemove} disabled={!avatar}>
                  <X size={14} />
                  Remove
                </button>
                <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
              </div>
            </div>

            {/* Form Fields */}
            <div className="set-form-grid">
              <div className="set-field">
                <label>First Name</label>
                <input value={firstName} onChange={handleFieldChange(setFirstName)} />
              </div>
              <div className="set-field">
                <label>Last Name</label>
                <input value={lastName} onChange={handleFieldChange(setLastName)} />
              </div>
              <div className="set-field set-field-full">
                <label>Work Email</label>
                <input type="email" value={email} onChange={handleFieldChange(setEmail)} />
              </div>
            </div>
          </div>

          {/* Security Card */}
          <div className="set-card">
            <div className="set-card-header">
              <h3 className="set-card-title">Security</h3>
              <p className="set-card-sub">Manage your password and two-factor authentication</p>
            </div>

            {/* Password Row */}
            <div className="set-security-row">
              <div className="set-security-left">
                <div className="set-security-icon">
                  <Lock size={18} />
                </div>
                <div>
                  <h4 className="set-security-label">Password</h4>
                  <p className="set-security-meta">Last changed 3 months ago</p>
                </div>
              </div>
              <button className="set-btn set-btn-outline" onClick={() => setShowPasswordModal(true)}>
                <Key size={14} />
                Update Password
              </button>
            </div>

            <div className="set-security-divider" />

            {/* 2FA Row */}
            <div className="set-security-row">
              <div className="set-security-left">
                <div className="set-security-icon set-security-icon-orange">
                  <Smartphone size={18} />
                </div>
                <div>
                  <h4 className="set-security-label">Two-Factor Authentication</h4>
                  <p className="set-security-meta">Not enabled</p>
                </div>
              </div>
              <button className="set-btn set-btn-outline" onClick={() => toast.success('2FA setup opened')}>
                <Shield size={14} />
                Setup 2FA
              </button>
            </div>
          </div>

          {/* Footer Action Bar */}
          <div className="set-footer-bar">
            <div className="set-footer-status">
              {hasChanges ? (
                <>
                  <span className="set-unsaved-dot" />
                  <span>Unsaved changes in Account</span>
                </>
              ) : (
                <span>No unsaved changes</span>
              )}
            </div>
            <div className="set-footer-actions">
              <button className="set-btn set-btn-outline" onClick={handleReset}>
                <RotateCcw size={14} />
                Reset
              </button>
              <button className="set-btn set-btn-primary" onClick={handleSave}>
                <Save size={14} />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="dash-footer">
        © 2024 Automated Timetable Generation System · University Administration Portal · v1.0.2
      </div>

      {/* Password Update Modal */}
      {showPasswordModal && (
        <div className="pg-modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="pg-modal" onClick={(e) => e.stopPropagation()}>
            <button className="pg-modal-close" onClick={() => setShowPasswordModal(false)}>
              <X size={18} />
            </button>
            <div className="pg-modal-header">
              <div className="pg-modal-header-icon">
                <Lock size={22} />
              </div>
              <div>
                <h2>Update Password</h2>
                <p>Choose a new password for your account</p>
              </div>
            </div>
            <form onSubmit={handleUpdatePassword} style={{ padding: '0.5rem 1.5rem 1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem', color: 'var(--text-muted)' }}>Current Password</label>
                  <input type="password" required placeholder="Enter current password" value={pwd.current} onChange={(e) => setPwd({ ...pwd, current: e.target.value })} style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem', color: 'var(--text-muted)' }}>New Password</label>
                  <input type="password" required placeholder="At least 6 characters" value={pwd.next} onChange={(e) => setPwd({ ...pwd, next: e.target.value })} style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem', color: 'var(--text-muted)' }}>Confirm New Password</label>
                  <input type="password" required placeholder="Re-enter new password" value={pwd.confirm} onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })} style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }} />
                </div>
              </div>
              <div className="pg-modal-actions" style={{ marginTop: '1rem' }}>
                <button type="button" className="pg-modal-btn pg-modal-btn-cancel" onClick={() => setShowPasswordModal(false)}>Cancel</button>
                <button type="submit" className="pg-modal-btn pg-modal-btn-submit" disabled={saving}>
                  {saving ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
