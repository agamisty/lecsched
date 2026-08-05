import { Activity } from 'lucide-react';

export default function Logo({ variant = 'full', style, className = '' }) {
  if (variant === 'icon') {
    return (
      <div className={`atgs-icon ${className}`} style={style}>
        <Activity size={22} strokeWidth={2.5} />
      </div>
    );
  }

  return (
    <div className={`atgs-brand ${className}`} style={style}>
      <div className="atgs-icon">
        <Activity size={22} strokeWidth={2.5} />
      </div>
      <span className="atgs-text">ATGS</span>
    </div>
  );
}
