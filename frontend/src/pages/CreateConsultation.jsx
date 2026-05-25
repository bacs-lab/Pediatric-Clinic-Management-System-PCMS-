import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiUrl } from "../utils/api";
import { notify } from "../utils/notify";

function CreateConsultation({
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

  const [patients, setPatients] = useState([]);
  const [assessment, setAssessment] = useState(null);

  const [form, setForm] = useState({
    patientId: queueItem?.patientId || "",
    patientName: queueItem?.patientName || "",
    queueId: queueItem?._id || "",

    diagnosis: "",
    treatment: "",
    prescription: "",
    doctorName: "",
    consultationNotes: "",
    followUpDate: "",
  });

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

  useEffect(() => {
      if (!form.patientId) return;
    fetch(
  apiUrl(`/api/assessments/patient/${form.patientId}`),
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
)
      .then((res) => res.json())
      .then((data) => {
        if (data.length > 0) {
          setAssessment(data[0]);

          setForm((prev) => ({
            ...prev,
            assessmentId: data[0]._id,
          }));
        }
      })
      .catch((err) => console.log(err));
  }, [form.patientId, token]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
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

    const res = await fetch(
      apiUrl("/api/records"),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      }
    );

    if (res.ok) {
      notify("Consultation saved.");
      if (onSaved) onSaved();
      else navigate("/staff/queue");
    } else {
      const data = await res.json().catch(() => ({}));
      notify(data.message || "Failed to create consultation");
    }
  };

  return (
    <>
        <h1 className={embedded ? "modal-title" : "page-title"}>
          Doctor Consultation
        </h1>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Patient</label>
            {lockedQueuePatient ? (
              <input
                value={`#${queueItem.queueNumber} - ${queueItem.patientName}`}
                readOnly
              />
            ) : (
              <select value={form.patientId} onChange={(e) => {
                const selected = patients.find((p) => p._id === e.target.value);
                if (selected) {
                  setForm({ ...form, patientId: selected._id, patientName: `${selected.firstName} ${selected.lastName}` });
                }
              }}>
                <option value="">Select Patient</option>
                {patients.map((patient) => (
                  <option key={patient._id} value={patient._id}>
                    {patient.firstName} {patient.lastName}
                  </option>
                ))}
              </select>
            )}
          </div>

          {assessment && (
            <div className="card">
              <h2>Assessment Info</h2>

              <p>
                <strong>Height:</strong>{" "}
                {assessment.height}
              </p>

              <p>
                <strong>Weight:</strong>{" "}
                {assessment.weight}
              </p>

              <p>
                <strong>Temperature:</strong>{" "}
                {assessment.temperature}
              </p>

              <p>
                <strong>Symptoms:</strong>{" "}
                {assessment.symptoms}
              </p>

              <p>
                <strong>Remarks:</strong>{" "}
                {assessment.remarks}
              </p>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Diagnosis</label>
            <input
              name="diagnosis"
              placeholder="Diagnosis"
              value={form.diagnosis}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Treatment</label>
            <input
              name="treatment"
              placeholder="Treatment"
              value={form.treatment}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Prescription</label>
            <textarea
              name="prescription"
              placeholder="Prescription"
              value={form.prescription}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Consultation Notes</label>
            <textarea
              name="consultationNotes"
              placeholder="Consultation Notes"
              value={form.consultationNotes}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Follow-up Date</label>
            <input
              type="date"
              name="followUpDate"
              value={form.followUpDate}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Doctor Name</label>
            <input
              name="doctorName"
              placeholder="Doctor Name"
              value={form.doctorName}
              onChange={handleChange}
            />
          </div>

          <div className="modal-buttons">
            {embedded && (
              <button className="secondary-btn" type="button" onClick={onCancel}>
                Cancel
              </button>
            )}
            <button
              className="primary-btn"
              type="submit"
            >
              Complete Consultation
            </button>
          </div>
        </form>
      </>
    );
}

export default CreateConsultation;
