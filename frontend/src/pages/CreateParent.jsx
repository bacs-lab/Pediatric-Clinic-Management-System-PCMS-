import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "../utils/api";
import { notify } from "../utils/notify";

function CreateParent({ embedded = false, onCancel, onSaved }) {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    contactNumber: "",
    address: "",
    relationshipToChild: "",
    emergencyContact: "",
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // CREATE USER ACCOUNT
      const userRes = await fetch(
        apiUrl("/api/auth/register"),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: form.fullName,
            email: form.email,
            password: form.password,
            role: "parent",
          }),
        }
      );

      const userData = await userRes.json();

      if (!userRes.ok) {
        notify(userData.message || "Failed to create parent account");
        return;
      }

      // CREATE PARENT PROFILE
      const profileRes = await fetch(
        apiUrl("/api/parent-profiles"),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: userData.user._id,
            fullName: form.fullName,
            contactNumber: form.contactNumber,
            address: form.address,
            relationshipToChild: form.relationshipToChild,
            emergencyContact: form.emergencyContact,
          }),
        }
      );

      if (profileRes.ok) {
        notify("Parent account and profile created!");
        if (onSaved) onSaved();
        else navigate("/staff/dashboard");
      } else {
        notify("Failed to create parent profile");
      }
    } catch (error) {
      console.log(error);
      notify("Something went wrong");
    }
  };

  return (
    <>
        <h1 className={embedded ? "modal-title" : "page-title"}>Create Guardian Account</h1>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              name="fullName"
              placeholder="Full Name"
              value={form.fullName}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              name="email"
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              name="password"
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Contact Number</label>
            <input
              name="contactNumber"
              placeholder="Contact Number"
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

          <div className="form-group">
            <label className="form-label">Relationship to Child</label>
            <input
              name="relationshipToChild"
              placeholder="Relationship to Child"
              value={form.relationshipToChild}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Emergency Contact</label>
            <input
              name="emergencyContact"
              placeholder="Emergency Contact"
              value={form.emergencyContact}
              onChange={handleChange}
            />
          </div>

          <div className="modal-buttons">
            {embedded && (
              <button className="secondary-btn" type="button" onClick={onCancel}>
                Cancel
              </button>
            )}
            <button className="primary-btn" type="submit">
              Create Guardian
            </button>
          </div>
        </form>
      </>
    );
}

export default CreateParent;
