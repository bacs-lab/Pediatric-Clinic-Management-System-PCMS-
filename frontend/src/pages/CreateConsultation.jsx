import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function CreateConsultation() {
  const navigate = useNavigate();
  const location = useLocation();

  const queueItem = location.state || {};
  const token = localStorage.getItem("token");

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

  useEffect(() => {
      if (!queueItem.patientId) return;
    fetch(
  `http://localhost:5000/api/assessments/patient/${queueItem.patientId}`,
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
  }, [queueItem.patientId, token]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!queueItem._id || !form.patientId) {
    alert("No queue item selected");
    return;
  }

    const res = await fetch(
      "http://localhost:5000/api/records",
      {
        method: "POST",
        headers: {
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
},
        body: JSON.stringify(form),
      }
    );

    if (res.ok) {
      await fetch(
        `http://localhost:5000/api/queue/${queueItem._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: "For Billing" }),
        }
      );

      alert("Consultation completed!");
      navigate("/staff/queue");
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.message || "Failed to create consultation");
    }
  };

  return (
    <>
        <h1 className="page-title">
          Doctor Consultation
        </h1>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Patient</label>
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

          <button
            className="primary-btn"
            type="submit"
          >
            Complete Consultation
          </button>
        </form>
      </>
    );
}

export default CreateConsultation;