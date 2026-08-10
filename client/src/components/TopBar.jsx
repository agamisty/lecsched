import { Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function TopBar() {
  const { user } = useAuth();
  const initials = (user?.name || 'AU').split(' ').map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();

  return (
    <div className="dash-topbar">
      <div className="dash-topbar-right">
        <button type="button" className="dash-notif-btn" aria-label="Notifications">
          <Bell size={20} />
          <span className="dash-notif-dot" />
        </button>
        <div className="dash-divider" />
        <div className="dash-admin">
          <div className="dash-admin-info">
            <span className="dash-admin-name">{user?.name || 'Admin User'}</span>
            <span className="dash-admin-role">University Admin</span>
          </div>
          {user?.avatar ? (
            <img src={user.avatar} alt="" className="dash-avatar-img" style={{ objectFit: 'cover' }} />
          ) : (
            <div className="dash-avatar-img" style={{ borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>
              {initials}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
