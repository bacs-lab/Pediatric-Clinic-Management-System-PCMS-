import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiUrl } from "../utils/api";
import { notify } from "../utils/notify";

function CreateAssessment({
  embedded = false,
  initialQueueItem,
  onCancel,
  onSaved,
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const queueItem = initialQueueItem || location.state || {};
  const token = localStorage.getItem("token");
  const lockedQueuePatient = embedded && Boolean(queueItem?._id);

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
    if (lockedQueuePatient) return;

    fetch(apiUrl("/api/patients"), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setPatients(data);
        if (queueItem.patientId && data.length > 0) {
          const match = data.find((p) => p._id === queueItem.patientId);
          if (match) {
            setForm((prev) => ({
              ...prev,
              patientId: match._id,
              patientName: `${match.firstName} ${match.lastName}`,
            }));
          }
        }
      })
      .catch((err) => console.log(err));
  }, [lockedQueuePatient, queueItem.patientId, token]);

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
    const payload = lockedQueuePatient
      ? {
          ...form,
          queueId: queueItem._id,
          patientId: queueItem.patientId,
          patientName: queueItem.patientName,
        }
      : form;

    if (!payload.queueId || !payload.patientId) {
      notify("No queue item selected");
      return;
    }

    const res = await fetch(apiUrl("/api/assessments"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      notify("Assessment saved!");
      if (onSaved) onSaved();
      else navigate("/staff/queue");
    } else {
      const data = await res.json().catch(() => ({}));
      notify(data.message || "Failed to save assessment");
    }
  };

  return (
    <>
        <h1 className={embedded ? "modal-title" : "page-title"}>Physical Assessment</h1>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Patient</label>
            {lockedQueuePatient ? (
              <input
                value={`#${queueItem.queueNumber} - ${queueItem.patientName}`}
                readOnly
              />
            ) : (
              <select value={form.patientId} onChange={handlePatientSelect}>
                <option value="">Select Patient</option>
                {patients.map((patient) => (
                  <option key={patient._id} value={patient._id}>
                    {patient.firstName} {patient.lastName}
                  </option>
                ))}
              </select>
            )}
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

          <div className="modal-buttons">
            {embedded && (
              <button className="secondary-btn" type="button" onClick={onCancel}>
                Cancel
              </button>
            )}
            <button className="primary-btn" type="submit">
              Save Assessment
            </button>
          </div>
        </form>
      </>
    );
}

export default CreateAssessment;
