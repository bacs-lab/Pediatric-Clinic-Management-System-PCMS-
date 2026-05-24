import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Topbar from './Topbar';
import Navbar from './Navbar';
import { adminNavItems, staffNavItems, parentNavItems } from './navConfig';

function MainLayout({ children }) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const isStaff =
    user?.role &&
    ['staff', 'admin', 'doctor', 'nurse', 'secretary'].includes(user.role);
  const isParent = user?.role === 'parent';

  const navItems = user?.role === 'admin'
    ? adminNavItems
    : isStaff
      ? staffNavItems
      : isParent
        ? parentNavItems
        : [];

  const visibleNavItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(user?.role)
  );

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="layout">
      <div
        className={`sidebar-overlay${sidebarOpen ? ' active' : ''}`}
        onClick={closeSidebar}
      />
      <Navbar
        navItems={visibleNavItems}
        onLogout={logout}
        isOpen={sidebarOpen}
        onClose={closeSidebar}
      />
      <div className="main-content">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        {children}
      </div>
    </div>
  );
}

export default MainLayout;
