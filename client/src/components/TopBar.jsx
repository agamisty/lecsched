import { Search, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ADMIN_AVATAR = 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=80&h=80&fit=crop&crop=face';

export default function TopBar() {
  const { user } = useAuth();

  return (
    <div className="dash-topbar">
      <div className="dash-search">
        <Search size={16} />
        <input placeholder="Search for courses, lecturers, or schedules..." />
      </div>
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
          <img src={ADMIN_AVATAR} alt="" className="dash-avatar-img" />
        </div>
      </div>
    </div>
  );
}
