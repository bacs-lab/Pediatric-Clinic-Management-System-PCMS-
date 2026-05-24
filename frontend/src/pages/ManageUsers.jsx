import { useEffect, useMemo, useState } from "react";
import ConfirmDialog from "../components/ConfirmDialog";
import EmptyState from "../components/EmptyState";
import LoadingState from "../components/LoadingState";
import { apiUrl, authHeaders } from "../utils/api";
import { notifyError, notifySuccess } from "../utils/notify";

const STAFF_ROLE_OPTIONS = [
  { value: "doctor", label: "Doctor" },
  { value: "secretary", label: "Secretary" },
];

const emptyStaffForm = {
  name: "",
  email: "",
  role: "doctor",
  password: "",
};

function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [resetUser, setResetUser] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [form, setForm] = useState(emptyStaffForm);
  const [saving, setSaving] = useState(false);

  const fetchUsers = () => {
    fetch(apiUrl("/api/users"), {
      headers: authHeaders(),
    })
      .then((res) => res.json())
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch(() => notifyError("Failed to load staff accounts."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const term = search.toLowerCase();
    return users.filter((user) =>
      [user.name, user.email, user.role, user.status]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term))
    );
  }, [search, users]);

  const handleFormChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const createStaff = async (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      notifyError("Name is required");
      return;
    }

    if (!form.email.trim()) {
      notifyError("Email is required");
      return;
    }

    if (!form.password) {
      notifyError("Temporary password is required.");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch(apiUrl("/api/users/create-staff"), {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        notifyError(data.message || "Failed to create staff account.");
        return;
      }

      setUsers((current) => [data, ...current]);
      setForm(emptyStaffForm);
      setCreateOpen(false);
      notifySuccess("Staff account created with temporary password.");
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (user, status) => {
    const res = await fetch(apiUrl(`/api/users/${user._id}/status`), {
      method: "PUT",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ status }),
    });

    const data = await res.json();

    if (!res.ok) {
      notifyError(data.message || "Failed to update staff status.");
      return;
    }

    setUsers((current) =>
      current.map((item) => (item._id === data._id ? data : item))
    );
    notifySuccess(`Staff account ${status.toLowerCase()}.`);
  };

  const resetPassword = async (event) => {
    event.preventDefault();

    if (!temporaryPassword) {
      notifyError("Temporary password is required.");
      return;
    }

    const res = await fetch(apiUrl(`/api/users/${resetUser._id}/reset-password`), {
      method: "PUT",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ password: temporaryPassword }),
    });

    const data = await res.json();

    if (!res.ok) {
      notifyError(data.message || "Failed to reset password.");
      return;
    }

    setUsers((current) =>
      current.map((item) => (item._id === data._id ? data : item))
    );
    setResetUser(null);
    setTemporaryPassword("");
    notifySuccess("Temporary password reset. Staff must change it at login.");
  };

  const deleteUser = async () => {
    if (!pendingDelete) return;

    const res = await fetch(apiUrl(`/api/users/${pendingDelete._id}`), {
      method: "DELETE",
      headers: authHeaders(),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      notifyError(data.message || "Failed to delete staff account.");
      return;
    }

    setUsers((current) => current.filter((item) => item._id !== pendingDelete._id));
    setPendingDelete(null);
    notifySuccess("Staff account deleted.");
  };

  if (loading) return <LoadingState title="Loading staff accounts..." />;

  return (
    <div className="dashboard-bg">
      <div className="dashboard-hero">
        <div>
          <p className="eyebrow">ADMIN ACCESS CONTROL</p>
          <h1 className="page-heading">
            <i className="page-heading-icon ti ti-users-cog" aria-hidden="true" />
            Manage Users
          </h1>
          <span>Create staff accounts, reset temporary passwords, and disable access.</span>
        </div>

        <button className="primary-btn" onClick={() => setCreateOpen(true)}>
          <span className="ti ti-user-plus" />
          Create Staff
        </button>
      </div>

      <div className="stats-row users-stats-row">
        <div className="metric-card blue">
          <span className="ti ti-users" />
          <p>Total Staff</p>
          <h2>{users.length}</h2>
        </div>
        <div className="metric-card green">
          <span className="ti ti-circle-check" />
          <p>Active</p>
          <h2>{users.filter((user) => user.status !== "Disabled").length}</h2>
        </div>
        <div className="metric-card red">
          <span className="ti ti-user-off" />
          <p>Disabled</p>
          <h2>{users.filter((user) => user.status === "Disabled").length}</h2>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h2 className="panel-title">
            <i className="ti ti-shield-lock" aria-hidden="true" />
            Staff Accounts
          </h2>
          <span>{filteredUsers.length} account(s)</span>
        </div>

        <div className="inventory-filters">
          <input
            className="search-input"
            placeholder="Search staff by name, email, role..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        {filteredUsers.length === 0 ? (
          <EmptyState
            icon="ti ti-user-search"
            title="No staff accounts found"
            message="Create a staff account or adjust the search."
            actionLabel="Create Staff"
            onAction={() => setCreateOpen(true)}
          />
        ) : (
          <div className="table-container flat">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Password</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user._id}>
                    <td><strong>{user.name}</strong></td>
                    <td>{user.email}</td>
                    <td className="text-capitalize">{user.role}</td>
                    <td>
                      <span className={`status-badge ${user.status === "Disabled" ? "missed" : "paid"}`}>
                        {user.status || "Active"}
                      </span>
                    </td>
                    <td>
                      {user.mustChangePassword ? (
                        <span className="status-badge pending">Must Change</span>
                      ) : (
                        <span className="status-badge paid">Updated</span>
                      )}
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="secondary-btn"
                          onClick={() => setResetUser(user)}
                        >
                          Reset
                        </button>
                        <button
                          className={user.status === "Disabled" ? "primary-btn" : "danger-btn"}
                          onClick={() =>
                            updateStatus(
                              user,
                              user.status === "Disabled" ? "Active" : "Disabled"
                            )
                          }
                        >
                          {user.status === "Disabled" ? "Enable" : "Disable"}
                        </button>
                        <button
                          className="danger-btn"
                          onClick={() => setPendingDelete(user)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {createOpen && (
        <div className="modal-overlay" onClick={() => setCreateOpen(false)}>
          <div className="modal-content" onClick={(event) => event.stopPropagation()}>
            <h1 className="modal-title">Create Staff Account</h1>
            <form onSubmit={createStaff}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  name="name"
                  placeholder="Full name"
                  value={form.name}
                  onChange={handleFormChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  name="email"
                  type="email"
                  placeholder="Email address"
                  value={form.email}
                  onChange={handleFormChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Role</label>
                <select name="role" value={form.role} onChange={handleFormChange}>
                  {STAFF_ROLE_OPTIONS.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Temporary Password</label>
                <input
                  name="password"
                  type="password"
                  placeholder="Temporary password"
                  value={form.password}
                  onChange={handleFormChange}
                />
              </div>

              <div className="modal-buttons">
                <button
                  className="secondary-btn"
                  type="button"
                  onClick={() => setCreateOpen(false)}
                >
                  Cancel
                </button>
                <button className="primary-btn" type="submit" disabled={saving}>
                  {saving ? "Creating..." : "Create Staff"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {resetUser && (
        <div className="modal-overlay" onClick={() => setResetUser(null)}>
          <div className="modal-content" onClick={(event) => event.stopPropagation()}>
            <h1 className="modal-title">Reset Password</h1>
            <p className="modal-support-text">
              Set a temporary password for {resetUser.name}. They must change it after login.
            </p>
            <form onSubmit={resetPassword}>
              <div className="form-group">
                <label className="form-label">Temporary Password</label>
                <input
                  type="password"
                  placeholder="Temporary password"
                  value={temporaryPassword}
                  onChange={(event) => setTemporaryPassword(event.target.value)}
                />
              </div>

              <div className="modal-buttons">
                <button
                  className="secondary-btn"
                  type="button"
                  onClick={() => setResetUser(null)}
                >
                  Cancel
                </button>
                <button className="primary-btn" type="submit">
                  Reset Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {pendingDelete && (
        <ConfirmDialog
          title="Delete staff account?"
          message={`${pendingDelete.name} will be removed from staff account access. This cannot be undone.`}
          confirmLabel="Delete Account"
          onCancel={() => setPendingDelete(null)}
          onConfirm={deleteUser}
        />
      )}
    </div>
  );
}

export default ManageUsers;
