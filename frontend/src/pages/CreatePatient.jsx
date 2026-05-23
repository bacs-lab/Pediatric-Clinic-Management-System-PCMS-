import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "../utils/api";
import { notify } from "../utils/notify";

function CreatePatient({ embedded = false, onCancel, onSaved }) {
  const navigate = useNavigate();

  const [guardians, setGuardians] = useState([]);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    birthDate: "",
    age: "",
    gender: "Male",
    guardianId: "",
    guardianName: "",
    contactNumber: "",
    address: "",
    bloodType: "",
    allergies: "",
    notes: "",
  });

  useEffect(() => {
    fetch(apiUrl("/api/parent-profiles"), {
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
})
      .then((res) => res.json())
      .then((data) => setGuardians(data))
      .catch((err) => console.log(err));
  }, []);

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

    if (!selectedGuardian) return;

    setForm({
      ...form,
      guardianId: selectedGuardian.userId,
      guardianName: selectedGuardian.fullName,
      contactNumber: selectedGuardian.contactNumber || "",
      address: selectedGuardian.address || "",
    });
  };

  const handleBirthDateChange = (e) => {
    const birthDate = e.target.value;

    setForm({
      ...form,
      birthDate,
      age: calculateAge(birthDate),
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

if (!form.guardianId) {
  notify("Please select a guardian");
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

    const payload = {
      ...form,
      age: form.age ? Number(form.age) : undefined,
    };

    const res = await fetch(apiUrl("/api/patients"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      notify("Child patient created!");
      if (onSaved) onSaved();
      else navigate("/staff/dashboard");
    } else {
      const data = await res.json();
      notify(data.message || "Failed to create patient");
    }
  };

  return (
    <>
        <h1 className={embedded ? "modal-title" : "page-title"}>Create Child Patient</h1>

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

          <div className="form-group">
            <label className="form-label">Guardian Name</label>
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

          <div className="form-group">
            <label className="form-label">Age</label>
            <input
              name="age"
              type="number"
              min="0"
              placeholder="Auto-calculated from birth date"
              value={form.age}
              readOnly
            />
          </div>

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
              Create Patient
            </button>
          </div>
        </form>
      </>
    );
}

export default CreatePatient;
