import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

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

  const [patients, setPatients] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/patients", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setPatients(data))
      .catch((err) => console.log(err));
  }, [token]);

  // auto-select the queue patient once patients list loads
  useEffect(() => {
    if (queueItem.patientId && patients.length > 0) {
      const match = patients.find((p) => p._id === queueItem.patientId);
      if (match) {
        setForm((prev) => ({
          ...prev,
          patientId: match._id,
          patientName: `${match.firstName} ${match.lastName}`,
        }));
      }
    }
  }, [queueItem.patientId, patients]);

  const handlePatientSelect = (e) => {
    const selected = patients.find((p) => p._id === e.target.value);
    if (!selected) {
      setForm({ ...form, patientId: "", patientName: "" });
      return;
    }
    setForm({
      ...form,
      patientId: selected._id,
      patientName: `${selected.firstName} ${selected.lastName}`,
    });
  };

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
      const data = await res.json().catch(() => ({}));
      alert(data.message || "Failed to save assessment");
    }
  };

  return (
    <>
        <h1 className="page-title">Physical Assessment</h1>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Patient</label>
            <select value={form.patientId} onChange={handlePatientSelect}>
              <option value="">Select Patient</option>
              {patients.map((patient) => (
                <option key={patient._id} value={patient._id}>
                  {patient.firstName} {patient.lastName}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Height (cm)</label>
            <input
              name="height"
              placeholder="e.g. 120"
              value={form.height}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Weight (kg)</label>
            <input
              name="weight"
              placeholder="e.g. 25"
              value={form.weight}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Temperature (°C)</label>
            <input
              name="temperature"
              placeholder="e.g. 37.2"
              value={form.temperature}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Blood Pressure</label>
            <input
              name="bloodPressure"
              placeholder="e.g. 120/80"
              value={form.bloodPressure}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Heart Rate (bpm)</label>
            <input
              name="heartRate"
              placeholder="e.g. 80"
              value={form.heartRate}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Symptoms</label>
            <textarea
              name="symptoms"
              placeholder="Describe patient symptoms"
              value={form.symptoms}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Reason for Visit</label>
            <textarea
              name="reasonForVisit"
              placeholder="Reason for Visit"
              value={form.reasonForVisit}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Initial Remarks</label>
            <textarea
              name="remarks"
              placeholder="Initial Remarks"
              value={form.remarks}
              onChange={handleChange}
            />
          </div>

          <button className="primary-btn" type="submit">
            Save Assessment
          </button>
        </form>
      </>
    );
}

export default CreateAssessment;