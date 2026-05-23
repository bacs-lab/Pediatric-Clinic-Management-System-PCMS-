import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function Navbar({ navItems, title = 'KIDS FIRST', onLogout, isOpen, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [openMenus, setOpenMenus] = useState({});

  useEffect(() => {
    const next = {};
    navItems.forEach((item) => {
      if (item.children) {
        const childActive = item.children.some(
          (child) => location.pathname === child.path
        );
        if (childActive) {
          next[item.label] = true;
        }
      }
    });
    setOpenMenus((prev) => ({ ...prev, ...next }));
  }, [location.pathname, navItems]);

  const toggleMenu = (label) => {
    setOpenMenus((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const isActive = (path) => location.pathname === path;

  const handleNav = (path) => {
    navigate(path);
    onClose();
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
        <h2>{title}</h2>

      </div>

      <ul>
        {navItems.map((item) => {
          const hasChildren = item.children?.length > 0;
          const childActive =
            hasChildren &&
            item.children.some((child) => isActive(child.path));
          const menuOpen = openMenus[item.label] || false;
          const parentActive = isActive(item.path) || childActive;

          return (
            <li key={item.label} className="nav-item">
              <div
                className={`nav-parent-btn${parentActive ? ' active' : ''}`}
              >
                <span
                  className="nav-label"
                  onClick={() => handleNav(item.path)}
                  title={item.label}
                >
                  <span className={item.icon}></span>
                  {item.label}
                </span>
                {hasChildren && (
                  <span
                    className={`nav-arrow ti ti-chevron-${menuOpen ? 'up' : 'down'}`}
                    onClick={(e) => { e.stopPropagation(); toggleMenu(item.label); }}
                  ></span>
                )}
              </div>

              {hasChildren && menuOpen && (
                <ul className="nav-child-list">
                  {item.children.map((child) => (
                    <li key={child.path} className="nav-child-item">
                      <button
                        className={isActive(child.path) ? 'active' : ''}
                        onClick={() => handleNav(child.path)}
                      >
                        <span className={child.icon}></span>
                        {child.label}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>

      {onLogout && (
        <div className="nav-footer">
          <button className="nav-logout-btn" onClick={onLogout}>
            <span className="ti ti-logout"></span>
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

export default Navbar;