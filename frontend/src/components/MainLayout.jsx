import { useNavigate } from 'react-router-dom';
import Topbar from './Topbar';
import Navbar from './Navbar';
import { staffNavItems, parentNavItems } from './navConfig';

function MainLayout({ children }) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const isStaff =
    user?.role &&
    ['staff', 'admin', 'doctor', 'nurse', 'secretary'].includes(user.role);
  const isParent = user?.role === 'parent';

  const navItems = isStaff
    ? staffNavItems
    : isParent
      ? parentNavItems
      : [];

  return (
    <div className="layout">
      <Navbar navItems={navItems} onLogout={logout} />
      <div className="main-content">
        <Topbar />
        {children}
      </div>
    </div>
  );
}

export default MainLayout;