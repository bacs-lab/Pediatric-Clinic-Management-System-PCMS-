import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl, authHeaders } from "../utils/api";
import { notify } from "../utils/notify";

function ChangePassword() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const user = JSON.parse(localStorage.getItem("user"));

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.currentPassword) {
      notify("Current password is required.");
      return;
    }

    if (form.newPassword.length < 6) {
      notify("New password must be at least 6 characters.");
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      notify("Passwords do not match.");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch(apiUrl("/api/auth/change-password"), {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        notify(data.message || "Failed to change password.");
        return;
      }

      localStorage.setItem("user", JSON.stringify(data.user));
      notify("Password changed successfully.");
      navigate(data.user.role === "parent" ? "/parent/dashboard" : "/staff/dashboard");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="login-page password-change-page">
      <div className="login-left">
        <h1>KIDS FIRST Clinic</h1>
        <p>Password Update Required</p>
        <span>You must change your temporary password before continuing.</span>
      </div>

      <div className="login-card">
        <h2>Change Password</h2>
        <p>{user?.email || "Secure your staff account"}</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Current Temporary Password</label>
            <input
              type="password"
              name="currentPassword"
              placeholder="Current password"
              value={form.currentPassword}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">New Password</label>
            <input
              type="password"
              name="newPassword"
              placeholder="New password"
              value={form.newPassword}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Confirm New Password</label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm new password"
              value={form.confirmPassword}
              onChange={handleChange}
            />
          </div>

          <button
            className="primary-btn"
            type="submit"
            disabled={saving}
            style={{ width: "100%", marginTop: "8px" }}
          >
            {saving ? "Saving..." : "Change Password"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ChangePassword;
