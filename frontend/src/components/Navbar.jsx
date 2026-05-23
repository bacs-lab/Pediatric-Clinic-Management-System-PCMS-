import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function Navbar({ navItems, title = 'KIDS FIRST', onLogout }) {
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

  return (
    <div className="sidebar">
      <h2>{title}</h2>

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
                  onClick={() => navigate(item.path)}
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
                        onClick={() => navigate(child.path)}
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