import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function CreatePatient() {
  const navigate = useNavigate();

  const [guardians, setGuardians] = useState([]);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    birthDate: "",
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
    fetch("http://localhost:5000/api/parent-profiles", {
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
})
      .then((res) => res.json())
      .then((data) => setGuardians(data))
      .catch((err) => console.log(err));
  }, []);

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

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.firstName.trim()) {
  alert("First name is required");
  return;
}

if (!form.lastName.trim()) {
  alert("Last name is required");
  return;
}

if (!form.birthDate) {
  alert("Birth date is required");
  return;
}

if (!form.gender) {
  alert("Gender is required");
  return;
}

if (!form.guardianId) {
  alert("Please select a guardian");
  return;
}

if (!form.contactNumber.trim()) {
  alert("Contact number is required");
  return;
}

if (form.contactNumber.length < 11) {
  alert("Contact number must be at least 11 digits");
  return;
}

    const res = await fetch("http://localhost:5000/api/patients", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      alert("Child patient created!");
      navigate("/staff/dashboard");
    } else {
      const data = await res.json();
      alert(data.message || "Failed to create patient");
    }
  };

  return (
    <>
        <h1 className="page-title">Create Child Patient</h1>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Guardian</label>
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
            <label className="form-label">Child First Name</label>
            <input
              name="firstName"
              placeholder="Child First Name"
              value={form.firstName}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Child Last Name</label>
            <input
              name="lastName"
              placeholder="Child Last Name"
              value={form.lastName}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Birth Date</label>
            <input
              name="birthDate"
              type="date"
              value={form.birthDate}
              onChange={handleChange}
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

          <button className="primary-btn" type="submit">
            Create Patient
          </button>
        </form>
      </>
    );
}

export default CreatePatient;