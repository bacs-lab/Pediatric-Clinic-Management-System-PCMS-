import { useLocation, useNavigate } from 'react-router-dom';

function Navbar({ navItems, title = 'Kids First', onLogout, isOpen, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  const handleNav = (path, state) => {
    navigate(path, state ? { state } : undefined);
    onClose();
  };

  const handleNavKeyDown = (event, path, state) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleNav(path, state);
    }
  };

  return (
    <div className={`sidebar${isOpen ? ' open' : ''}`}>
      <div className="sidebar-top">
        <button
          className="sidebar-close-btn"
          onClick={onClose}
          aria-label="Close menu"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <div className="sidebar-brand" title={title}>
          <img src="/OFFICIAL PCMS.png" alt="Kids First Pediatric Clinic" />
          <div>
            <h2>{title}</h2>
            <span>PCMS</span>
          </div>
        </div>
      </div>

      <ul className="nav-list">
        {navItems.map((item) => (
          <li key={item.label} className="nav-item">
            <div
              className={`nav-parent-btn${isActive(item.path) ? ' active' : ''}`}
              role="button"
              tabIndex={0}
              onClick={() => handleNav(item.path, item.state)}
              onKeyDown={(event) => handleNavKeyDown(event, item.path, item.state)}
              title={item.label}
              aria-label={item.label}
            >
              <span className="nav-label">
                <span className={item.icon}></span>
                <span className="nav-text">{item.label}</span>
              </span>
            </div>
          </li>
        ))}
      </ul>

      {onLogout && (
        <div className="nav-footer">
          <button className="nav-logout-btn" onClick={onLogout}>
            <span className="ti ti-logout"></span>
            <span className="nav-text">Logout</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default Navbar;
