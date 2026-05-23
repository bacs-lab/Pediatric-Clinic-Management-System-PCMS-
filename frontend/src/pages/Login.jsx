import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "../utils/api";
import { notify } from "../utils/notify";

const ROLE_OPTIONS = [
  { value: "parent", label: "Parent / Guardian" },
  { value: "staff", label: "Staff" },
  { value: "doctor", label: "Doctor" },
  { value: "nurse", label: "Nurse" },
  { value: "secretary", label: "Secretary" },
  { value: "admin", label: "Admin" },
];

function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [saving, setSaving] = useState(false);

  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  const [signupForm, setSignupForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "parent",
    contactNumber: "",
    address: "",
    relationshipToChild: "",
    emergencyContact: "",
  });

  const handleLoginChange = (event) => {
    setLoginForm({
      ...loginForm,
      [event.target.name]: event.target.value,
    });
  };

  const handleSignupChange = (event) => {
    setSignupForm({
      ...signupForm,
      [event.target.name]: event.target.value,
    });
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      const res = await fetch(apiUrl("/api/auth/login"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginForm),
      });

      const data = await res.json();

      if (!res.ok) {
        notify(data.message);
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      if (data.user.role === "parent") {
        navigate("/parent/dashboard");
      } else {
        navigate("/staff/dashboard");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSignup = async (event) => {
    event.preventDefault();

    if (!signupForm.name.trim()) {
      notify("Full name is required");
      return;
    }

    if (!signupForm.email.trim()) {
      notify("Email is required");
      return;
    }

    if (signupForm.password.length < 6) {
      notify("Password must be at least 6 characters");
      return;
    }

    if (signupForm.password !== signupForm.confirmPassword) {
      notify("Passwords do not match");
      return;
    }

    if (signupForm.role === "parent" && !signupForm.contactNumber.trim()) {
      notify("Contact number is required for parent accounts");
      return;
    }

    setSaving(true);

    try {
      const userRes = await fetch(apiUrl("/api/auth/register"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: signupForm.name,
          email: signupForm.email,
          password: signupForm.password,
          role: signupForm.role,
        }),
      });

      const userData = await userRes.json();

      if (!userRes.ok) {
        notify(userData.message || "Failed to create account");
        return;
      }

      if (signupForm.role === "parent") {
        const profileRes = await fetch(apiUrl("/api/parent-profiles"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: userData.user._id || userData.user.id,
            fullName: signupForm.name,
            contactNumber: signupForm.contactNumber,
            address: signupForm.address,
            relationshipToChild: signupForm.relationshipToChild,
            emergencyContact: signupForm.emergencyContact,
          }),
        });

        if (!profileRes.ok) {
          notify("Account created, but parent profile was not saved");
          return;
        }
      }

      notify("Account created. Please log in.");
      setLoginForm({
        email: signupForm.email,
        password: "",
      });
      setSignupForm({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "parent",
        contactNumber: "",
        address: "",
        relationshipToChild: "",
        emergencyContact: "",
      });
      setMode("login");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-left">
        <h1>KIDS FIRST Clinic</h1>
        <p>Pediatric Clinic Management System</p>
        <span>Patient care made organized, secure, and simple.</span>
      </div>

      <div className="login-card">
        <div className="auth-switch">
          <button
            className={mode === "login" ? "active" : ""}
            type="button"
            onClick={() => setMode("login")}
          >
            Login
          </button>
          <button
            className={mode === "signup" ? "active" : ""}
            type="button"
            onClick={() => setMode("signup")}
          >
            Sign Up
          </button>
        </div>

        {mode === "login" ? (
          <>
            <h2>Welcome Back</h2>
            <p>Login to continue</p>

            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  name="email"
                  placeholder="Email address"
                  value={loginForm.email}
                  onChange={handleLoginChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={loginForm.password}
                  onChange={handleLoginChange}
                />
              </div>

              <button
                className="primary-btn"
                type="submit"
                disabled={saving}
                style={{ width: "100%", marginTop: "8px" }}
              >
                {saving ? "Logging in..." : "Login"}
              </button>
            </form>
          </>
        ) : (
          <>
            <h2>Create Account</h2>
            <p>Register as a parent, staff member, or clinic user</p>

            <form onSubmit={handleSignup}>
              <div className="form-group">
                <label className="form-label">Account Role</label>
                <select
                  name="role"
                  value={signupForm.role}
                  onChange={handleSignupChange}
                >
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  name="name"
                  placeholder="Full name"
                  value={signupForm.name}
                  onChange={handleSignupChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  name="email"
                  placeholder="Email address"
                  value={signupForm.email}
                  onChange={handleSignupChange}
                />
              </div>

              <div className="form-row-2col">
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={signupForm.password}
                    onChange={handleSignupChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="Confirm password"
                    value={signupForm.confirmPassword}
                    onChange={handleSignupChange}
                  />
                </div>
              </div>

              {signupForm.role === "parent" && (
                <div className="parent-signup-fields">
                  <div className="form-group">
                    <label className="form-label">Contact Number</label>
                    <input
                      name="contactNumber"
                      placeholder="Contact number"
                      value={signupForm.contactNumber}
                      onChange={handleSignupChange}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Address</label>
                    <input
                      name="address"
                      placeholder="Address"
                      value={signupForm.address}
                      onChange={handleSignupChange}
                    />
                  </div>

                  <div className="form-row-2col">
                    <div className="form-group">
                      <label className="form-label">Relationship to Child</label>
                      <input
                        name="relationshipToChild"
                        placeholder="Mother, father, guardian..."
                        value={signupForm.relationshipToChild}
                        onChange={handleSignupChange}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Emergency Contact</label>
                      <input
                        name="emergencyContact"
                        placeholder="Emergency contact"
                        value={signupForm.emergencyContact}
                        onChange={handleSignupChange}
                      />
                    </div>
                  </div>
                </div>
              )}

              <button
                className="primary-btn"
                type="submit"
                disabled={saving}
                style={{ width: "100%", marginTop: "8px" }}
              >
                {saving ? "Creating account..." : "Create Account"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default Login;
