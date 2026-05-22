import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Topbar from "../components/Topbar";

function EditRecord() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [form, setForm] = useState({
    patientName: "",
    age: "",
    gender: "Male",
    phone: "",
    address: "",
    chiefComplaint: "",
    diagnosis: "",
    treatment: "",
    prescription: "",
    doctorName: "",
  });

  useEffect(() => {
    fetch(`http://localhost:5000/api/records/${id}`, {
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
})
      .then((res) => res.json())
      .then((data) => {
        setForm({
          patientName: data.patientName || "",
          age: data.age || "",
          gender: data.gender || "Male",
          phone: data.phone || "",
          address: data.address || "",
          chiefComplaint: data.chiefComplaint || "",
          diagnosis: data.diagnosis || "",
          treatment: data.treatment || "",
          prescription: data.prescription || "",
          doctorName: data.doctorName || "",
        });
      })
      .catch((err) => console.log(err));
  }, [id]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await fetch(`http://localhost:5000/api/records/${id}`, {
      method: "PUT",
      headers: {
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
},
      body: JSON.stringify(form),
    });

    if (res.ok) {
      alert("Medical record updated!");
      navigate(`/staff/records/${id}`);
    } else {
      alert("Failed to update record");
    }
  };

  return (
  <div className="layout">
    <div className="sidebar">
      <h2>KIDS FIRST</h2>

      <ul>
        <li>
          <button onClick={() => navigate("/staff/dashboard")}>
            Dashboard
          </button>
        </li>

        <li>
          <button onClick={() => navigate(-1)}>
            Back
          </button>
        </li>
      </ul>
    </div>

    <div className="main-content dashboard-bg">
      <Topbar />

      <div className="dashboard-hero">
        <div>
          <p className="eyebrow">MEDICAL RECORD MANAGEMENT</p>
          <h1>Edit Medical Record</h1>
          <span>Update patient consultation and treatment details.</span>
        </div>
      </div>

      <div className="panel">
        <form onSubmit={handleSubmit}>
          <input
            name="patientName"
            placeholder="Patient Name"
            value={form.patientName}
            onChange={handleChange}
          />

          <input
            name="age"
            type="number"
            placeholder="Age"
            value={form.age}
            onChange={handleChange}
          />

          <select
            name="gender"
            value={form.gender}
            onChange={handleChange}
          >
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>

          <input
            name="phone"
            placeholder="Phone"
            value={form.phone}
            onChange={handleChange}
          />

          <input
            name="address"
            placeholder="Address"
            value={form.address}
            onChange={handleChange}
          />

          <input
            name="chiefComplaint"
            placeholder="Chief Complaint"
            value={form.chiefComplaint}
            onChange={handleChange}
          />

          <input
            name="diagnosis"
            placeholder="Diagnosis"
            value={form.diagnosis}
            onChange={handleChange}
          />

          <input
            name="treatment"
            placeholder="Treatment"
            value={form.treatment}
            onChange={handleChange}
          />

          <input
            name="prescription"
            placeholder="Prescription"
            value={form.prescription}
            onChange={handleChange}
          />

          <input
            name="doctorName"
            placeholder="Doctor Name"
            value={form.doctorName}
            onChange={handleChange}
          />

          <button className="primary-btn" type="submit">
            Update Record
          </button>
        </form>
      </div>
    </div>
  </div>
);
}

export default EditRecord;