import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl, authHeaders } from "../utils/api";
import { notify } from "../utils/notify";

function CreatePatient({ embedded = false, parentMode = false, onCancel, onSaved }) {
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("user")) || {};

  const [guardians, setGuardians] = useState([]);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    birthDate: "",
    gender: "Male",
    guardianId: "",
    guardianName: "",
    relationshipToChild: "",
    emergencyContact: "",
    contactNumber: "",
    address: "",
    bloodType: "",
    allergies: "",
    notes: "",
  });

  useEffect(() => {
    if (parentMode) return;

    fetch(apiUrl("/api/parent-profiles"), {
      headers: authHeaders(),
    })
      .then((res) => res.json())
      .then((data) => setGuardians(Array.isArray(data) ? data : []))
      .catch((err) => console.log(err));
  }, [parentMode]);

  const calculateAge = (birthDate) => {
    if (!birthDate) return "";

    const birth = new Date(birthDate);
    if (Number.isNaN(birth.getTime())) return "";

    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age -= 1;
    }

    return String(Math.max(age, 0));
  };

  const handleGuardianSelect = (e) => {
    const selectedGuardian = guardians.find(
      (guardian) => guardian.userId === e.target.value
    );

    if (!selectedGuardian) {
      setForm({
        ...form,
        guardianId: "",
        guardianName: "",
      });
      return;
    }

    setForm({
      ...form,
      guardianId: selectedGuardian.userId,
      guardianName: selectedGuardian.fullName,
      contactNumber: selectedGuardian.contactNumber || "",
      address: selectedGuardian.address || "",
    });
  };

  const handleBirthDateChange = (e) => {
    setForm({
      ...form,
      birthDate: e.target.value,
    });
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.firstName.trim()) {
      notify("First name is required");
      return;
    }

    if (!form.lastName.trim()) {
      notify("Last name is required");
      return;
    }

    if (!form.birthDate) {
      notify("Birth date is required");
      return;
    }

    if (!form.gender) {
      notify("Gender is required");
      return;
    }

    if (!parentMode && !form.guardianId) {
      notify("Please select a guardian");
      return;
    }

    if (parentMode && !currentUser.id) {
      notify("Please log in again before adding a child");
      return;
    }

    if (!form.relationshipToChild.trim()) {
      notify("Relationship to child is required");
      return;
    }

    if (!form.contactNumber.trim()) {
      notify("Contact number is required");
      return;
    }

    if (form.contactNumber.length < 11) {
      notify("Contact number must be at least 11 digits");
      return;
    }

    if (!form.emergencyContact.trim()) {
      notify("Emergency contact number is required");
      return;
    }

    if (form.emergencyContact.length < 11) {
      notify("Emergency contact number must be at least 11 digits");
      return;
    }

    const payload = {
      ...form,
      guardianId: parentMode ? currentUser.id : form.guardianId,
      guardianName: parentMode ? currentUser.name : form.guardianName,
      age: form.birthDate ? Number(calculateAge(form.birthDate)) : undefined,
    };

    const res = await fetch(apiUrl("/api/patients"), {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      notify(parentMode ? "Child request submitted for approval!" : "Child patient created!");
      if (onSaved) onSaved();
      else navigate(parentMode ? "/parent/dashboard" : "/staff/dashboard");
    } else {
      const data = await res.json();
      notify(data.message || "Failed to create patient");
    }
  };

  return (
    <>
        <h1 className={embedded ? "modal-title" : "page-title"}>
          {parentMode ? "Request Child Patient" : "Create Child Patient"}
        </h1>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">First Name</label>
            <input
              name="firstName"
              placeholder="First Name"
              value={form.firstName}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Last Name</label>
            <input
              name="lastName"
              placeholder="Last Name"
              value={form.lastName}
              onChange={handleChange}
            />
          </div>

          {parentMode ? (
            <div className="form-group">
              <label className="form-label">Name of Guardian</label>
              <input
                name="guardianName"
                value={currentUser.name || "Current parent"}
                readOnly
              />
            </div>
          ) : (
            <div className="form-group">
              <label className="form-label">Name of Guardian</label>
              <select
                name="guardianId"
                value={form.guardianId}
                onChange={handleGuardianSelect}
              >
                <option value="">Select Guardian</option>
                {guardians.map((guardian) => (
                  <option key={guardian._id} value={guardian.userId}>
                    {guardian.fullName}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Birth Date</label>
            <input
              name="birthDate"
              type="date"
              value={form.birthDate}
              onChange={handleBirthDateChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Gender</label>
            <select name="gender" value={form.gender} onChange={handleChange}>
              <option>Male</option>
              <option>Female</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Relationship to Child</label>
            <input
              name="relationshipToChild"
              placeholder="Mother, father, guardian..."
              value={form.relationshipToChild}
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
            <label className="form-label">Emergency Contact Number</label>
            <input
              name="emergencyContact"
              placeholder="Emergency Contact Number"
              value={form.emergencyContact}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Blood Type</label>
            <input
              name="bloodType"
              placeholder="Blood Type"
              value={form.bloodType}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Allergies</label>
            <input
              name="allergies"
              placeholder="Allergies"
              value={form.allergies}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Notes</label>
            <input
              name="notes"
              placeholder="Notes"
              value={form.notes}
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
              {parentMode ? "Submit Request" : "Create Patient"}
            </button>
          </div>
        </form>
      </>
    );
}

export default CreatePatient;
