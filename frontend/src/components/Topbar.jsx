function Topbar({ onMenuClick }) {
  const user = JSON.parse(localStorage.getItem("user"));
  const today = new Date().toLocaleDateString();

  return (
    <div className="topbar">
      <div className="topbar-left">
        <button
          className="hamburger-btn"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <div>
          <h2>KIDS FIRST CLINIC</h2>
          <p>{today}</p>
        </div>
      </div>

      <div className="topbar-right">
        <div className="role-badge">
          {user?.role?.toUpperCase()}
        </div>
        <div className="user-info">
          <strong>{user?.name}</strong>
          <span>{user?.email}</span>
        </div>
      </div>
    </div>
  );
}

export default Topbar;