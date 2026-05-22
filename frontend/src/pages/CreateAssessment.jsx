import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Topbar from "../components/Topbar";

function CreateAssessment() {
  const navigate = useNavigate();
  const location = useLocation();

  const queueItem = location.state || {};
  const token = localStorage.getItem("token");

  const [form, setForm] = useState({
    queueId: queueItem?._id || "",
    patientId: queueItem?.patientId || "",
    patientName: queueItem?.patientName || "",
    height: "",
    weight: "",
    temperature: "",
    bloodPressure: "",
    heartRate: "",
    symptoms: "",
    reasonForVisit: "",
    remarks: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!queueItem._id || !form.patientId) {
  alert("No queue item selected");
  return;
}

    const res = await fetch("http://localhost:5000/api/assessments", {
      method: "POST",
      headers: {
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
},
      body: JSON.stringify(form),
    });

    if (res.ok) {
      alert("Assessment saved!");
      navigate("/staff/queue");
    } else {
      alert("Failed to save assessment");
    }
  };

  return (
    <div className="layout">
      <div className="sidebar">
        <h2>PCMS Staff</h2>
        <ul>
          <li>
            <button onClick={() => navigate("/staff/queue")}>Queue</button>
          </li>
          <li>
            <button onClick={() => navigate(-1)}>Back</button>
          </li>
        </ul>
      </div>

      <div className="main-content">
        <Topbar />
        <h1 className="page-title">Physical Assessment</h1>

        <form onSubmit={handleSubmit}>
          <input value={form.patientName} readOnly />

          <input
            name="height"
            placeholder="Height"
            value={form.height}
            onChange={handleChange}
          />

          <input
            name="weight"
            placeholder="Weight"
            value={form.weight}
            onChange={handleChange}
          />

          <input
            name="temperature"
            placeholder="Temperature"
            value={form.temperature}
            onChange={handleChange}
          />

          <input
            name="bloodPressure"
            placeholder="Blood Pressure"
            value={form.bloodPressure}
            onChange={handleChange}
          />

          <input
            name="heartRate"
            placeholder="Heart Rate"
            value={form.heartRate}
            onChange={handleChange}
          />

          <textarea
            name="symptoms"
            placeholder="Symptoms"
            value={form.symptoms}
            onChange={handleChange}
          />

          <textarea
            name="reasonForVisit"
            placeholder="Reason for Visit"
            value={form.reasonForVisit}
            onChange={handleChange}
          />

          <textarea
            name="remarks"
            placeholder="Initial Remarks"
            value={form.remarks}
            onChange={handleChange}
          />

          <button className="primary-btn" type="submit">
            Save Assessment
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreateAssessment;