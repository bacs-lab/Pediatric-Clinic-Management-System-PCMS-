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
    <div className="layout">
      <div className="sidebar">
        <h2>PCMS Staff</h2>

        <ul>
          <li>
            <button onClick={() => navigate("/staff/dashboard")}>
              Dashboard
            </button>
          </li>

          <li>
            <button onClick={() => navigate(-1)}>Back</button>
          </li>
        </ul>
      </div>

      <div className="main-content">
        <h1 className="page-title">Create Child Patient</h1>

        <form onSubmit={handleSubmit}>
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

          <input
            name="guardianName"
            placeholder="Guardian Name"
            value={form.guardianName}
            readOnly
          />

          <input
            name="firstName"
            placeholder="Child First Name"
            value={form.firstName}
            onChange={handleChange}
          />

          <input
            name="lastName"
            placeholder="Child Last Name"
            value={form.lastName}
            onChange={handleChange}
          />

          <input
            name="birthDate"
            type="date"
            value={form.birthDate}
            onChange={handleChange}
          />

          <select name="gender" value={form.gender} onChange={handleChange}>
            <option>Male</option>
            <option>Female</option>
          </select>

          <input
            name="contactNumber"
            placeholder="Contact Number"
            value={form.contactNumber}
            onChange={handleChange}
          />

          <input
            name="address"
            placeholder="Address"
            value={form.address}
            onChange={handleChange}
          />

          <input
            name="bloodType"
            placeholder="Blood Type"
            value={form.bloodType}
            onChange={handleChange}
          />

          <input
            name="allergies"
            placeholder="Allergies"
            value={form.allergies}
            onChange={handleChange}
          />

          <input
            name="notes"
            placeholder="Notes"
            value={form.notes}
            onChange={handleChange}
          />

          <button className="primary-btn" type="submit">
            Create Patient
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreatePatient;