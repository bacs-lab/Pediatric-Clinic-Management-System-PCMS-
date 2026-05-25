import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LoadingState from "../components/LoadingState";
import PasswordField from "../components/PasswordField";
import { apiUrl, authHeaders } from "../utils/api";
import { notifyError, notifySuccess } from "../utils/notify";

const buildForm = (account = {}) => ({
  name: account.name || "",
  email: account.email || "",
  contactNumber: account.contactNumber || "",
  address: account.address || "",
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
});

const getStoredAccount = () => {
  try {
    const storedUser = JSON.parse(localStorage.getItem("user") || "null");
    return storedUser && typeof storedUser === "object" ? storedUser : null;
  } catch {
    return null;
  }
};

const buildAccountState = (payload = {}, fallbackRole = "") => {
  const user = payload.user || payload;
  const profile = payload.profile || {};
  const role = user?.role || fallbackRole || "";

  return {
    ...user,
    role,
    contactNumber:
      role === "parent"
        ? user?.contactNumber || profile?.contactNumber || ""
        : "",
    address:
      role === "parent"
        ? user?.address || profile?.address || ""
        : "",
    verificationStatus:
      role === "parent"
        ? user?.verificationStatus || profile?.verificationStatus || "Approved"
        : user?.verificationStatus || "Approved",
  };
};

function AccountSettings() {
  const navigate = useNavigate();
  const storedAccount = getStoredAccount();
  const storedRole = storedAccount?.role || "";
  const [loading, setLoading] = useState(!storedAccount);
  const [saving, setSaving] = useState(false);
  const [account, setAccount] = useState(storedAccount);
  const [form, setForm] = useState(buildForm(storedAccount || {}));

  const accountRole = account?.role || storedRole;
  const isParent = accountRole === "parent";

  useEffect(() => {
    let cancelled = false;

    const loadAccount = async () => {
      try {
        const res = await fetch(apiUrl("/api/auth/me"), {
          headers: authHeaders(),
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          if (res.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            navigate("/", { replace: true });
            return;
          }

          if (!cancelled) {
            notifyError(data.message || "Failed to load account details.");
          }
          return;
        }

        const loadedAccount = buildAccountState(data, storedRole);

        if (cancelled) return;

        localStorage.setItem("user", JSON.stringify(loadedAccount));
        setAccount(loadedAccount);
        setForm((current) => ({
          ...buildForm(loadedAccount),
          currentPassword: current.currentPassword,
          newPassword: current.newPassword,
          confirmPassword: current.confirmPassword,
        }));
      } catch {
        if (!cancelled) {
          notifyError("Failed to load account details.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadAccount();

    return () => {
      cancelled = true;
    };
  }, [navigate, storedRole]);

  const handleChange = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      notifyError("Full name is required.");
      return;
    }

    if (!form.email.trim()) {
      notifyError("Email is required.");
      return;
    }

    if (!form.currentPassword) {
      notifyError("Current password is required to save changes.");
      return;
    }

    if (form.newPassword || form.confirmPassword) {
      if (form.newPassword.length < 6) {
        notifyError("New password must be at least 6 characters.");
        return;
      }

      if (form.newPassword !== form.confirmPassword) {
        notifyError("New passwords do not match.");
        return;
      }
    }

    setSaving(true);

    try {
      const res = await fetch(apiUrl("/api/auth/me"), {
        method: "PUT",
        headers: authHeaders({
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          contactNumber: isParent ? form.contactNumber : undefined,
          address: isParent ? form.address : undefined,
          currentPassword: form.currentPassword,
          newPassword: form.newPassword || undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        notifyError(data.message || "Failed to update account details.");
        return;
      }

      const savedAccount = buildAccountState(data, accountRole);

      localStorage.setItem("user", JSON.stringify(savedAccount));
      setAccount(savedAccount);
      setForm({
        ...buildForm(savedAccount),
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      notifySuccess("Account details updated.");
    } catch {
      notifyError("Network error. Is the backend server running?");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState title="Loading account settings..." />;

  return (
    <div className="dashboard-bg">
      <div className="dashboard-hero account-hero">
        <div>
          <p className="eyebrow">ACCOUNT SECURITY</p>
          <h1 className="page-heading">
            <i className="page-heading-icon ti ti-user-cog" aria-hidden="true" />
            My Details
          </h1>
          <span>Update your account details after confirming your current password.</span>
        </div>
      </div>

      <form className="account-settings-grid" onSubmit={handleSubmit}>
        <section className="profile-card">
          <span className="profile-kicker">Profile</span>
          <h2>Personal Details</h2>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              name="name"
              placeholder="First and last name"
              value={form.name}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              name="email"
              type="email"
              placeholder="Email address"
              value={form.email}
              onChange={handleChange}
            />
          </div>

          {isParent && (
            <>
              <div className="form-group">
                <label className="form-label">Contact Number</label>
                <input
                  name="contactNumber"
                  placeholder="Contact number"
                  value={form.contactNumber}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Address</label>
                <input
                  name="address"
                  placeholder="Address"
                  value={form.address}
                  onChange={handleChange}
                />
              </div>
            </>
          )}
        </section>

        <section className="profile-card">
          <span className="profile-kicker">Password Required</span>
          <h2>Confirm Changes</h2>
          <p className="modal-support-text account-security-note">
            Enter your current password every time you save account changes.
          </p>

          <div className="form-group">
            <label className="form-label">Current Password</label>
            <PasswordField
              name="currentPassword"
              placeholder="Current password"
              value={form.currentPassword}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">New Password</label>
            <PasswordField
              name="newPassword"
              placeholder="Leave blank to keep current password"
              value={form.newPassword}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Confirm New Password</label>
            <PasswordField
              name="confirmPassword"
              placeholder="Confirm new password"
              value={form.confirmPassword}
              onChange={handleChange}
            />
          </div>

          <div className="modal-buttons account-actions">
            <button className="primary-btn" type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </section>
      </form>
    </div>
  );
}

export default AccountSettings;
