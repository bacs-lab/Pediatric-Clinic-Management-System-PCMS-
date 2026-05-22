function Topbar() {
  const user = JSON.parse(localStorage.getItem("user"));

  const today = new Date().toLocaleDateString();

  return (
    <div className="topbar">
      <div>
        <h2>KIDS FIRST CLINIC</h2>
        <p>{today}</p>
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