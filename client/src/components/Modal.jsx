import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, subtitle, children, size = 'md', headerVariant = 'default', headerIcon: HeaderIcon }) {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={`modal modal-${size}${headerVariant === 'banner' ? ' modal-has-banner' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {headerVariant === 'banner' ? (
          <div className="modal-header-banner">
            <div className="modal-banner-top">
              <div className="modal-banner-title-row">
                {HeaderIcon && <HeaderIcon size={22} />}
                <h2>{title}</h2>
              </div>
              <button type="button" className="modal-close modal-close-light" onClick={onClose} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            {subtitle && <p>{subtitle}</p>}
          </div>
        ) : (
          <div className="modal-header-default">
            <div>
              {HeaderIcon && (
                <div className="modal-header-icon">
                  <HeaderIcon size={20} />
                </div>
              )}
              <h2>{title}</h2>
              {subtitle && <p className="modal-subtitle">{subtitle}</p>}
            </div>
            <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
          </div>
        )}
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
