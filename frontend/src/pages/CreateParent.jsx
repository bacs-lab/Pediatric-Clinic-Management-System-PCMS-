import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PasswordField from "../components/PasswordField";
import { apiUrl, authHeaders } from "../utils/api";
import { notify } from "../utils/notify";

function CreateParent({
  embedded = false,
  editMode = false,
  parentProfile = null,
  onCancel,
  onSaved,
}) {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: editMode ? parentProfile?.fullName || "" : "",
    email: "",
    password: "",
    contactNumber: editMode ? parentProfile?.contactNumber || "" : "",
    address: editMode ? parentProfile?.address || "" : "",
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
      if (editMode && parentProfile?._id) {
        const res = await fetch(apiUrl(`/api/parent-profiles/${parentProfile._id}`), {
          method: "PUT",
          headers: authHeaders({
            "Content-Type": "application/json",
          }),
          body: JSON.stringify({
            fullName: form.fullName,
            contactNumber: form.contactNumber,
            address: form.address,
          }),
        });

        const data = await res.json();

        if (res.ok) {
          notify("Guardian profile updated!");
          if (onSaved) onSaved(data);
          else navigate("/staff/parents");
        } else {
          notify(data.message || "Failed to update guardian profile");
        }

        return;
      }

      const userRes = await fetch(apiUrl("/api/parent-profiles/create-account"), {
        method: "POST",
        headers: authHeaders({
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          password: form.password,
          contactNumber: form.contactNumber,
          address: form.address,
        }),
      });

      const userData = await userRes.json();

      if (userRes.ok) {
        notify("Parent account and profile created!");
        if (onSaved) onSaved();
        else navigate("/staff/dashboard");
      } else {
        notify(userData.message || "Failed to create parent account");
      }
    } catch (error) {
      console.log(error);
      notify("Something went wrong");
    }
  };

  return (
    <>
        <h1 className={embedded ? "modal-title" : "page-title"}>
          {editMode ? "Edit Guardian Profile" : "Create Guardian Account"}
        </h1>

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

          {!editMode && (
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
          )}

          {!editMode && (
            <div className="form-group">
              <label className="form-label">Password</label>
              <PasswordField
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
              />
            </div>
          )}

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

          <div className="modal-buttons">
            {embedded && (
              <button className="secondary-btn" type="button" onClick={onCancel}>
                Cancel
              </button>
            )}
            <button className="primary-btn" type="submit">
              {editMode ? "Save Guardian" : "Create Guardian"}
            </button>
          </div>
        </form>
      </>
    );
}

export default CreateParent;
