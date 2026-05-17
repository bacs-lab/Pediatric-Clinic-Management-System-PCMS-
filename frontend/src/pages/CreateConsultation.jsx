import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function CreateConsultation() {
  const navigate = useNavigate();
  const location = useLocation();

  const queueItem = location.state;

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
    fetch(
      `http://localhost:5000/api/assessments/patient/${queueItem.patientId}`
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
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await fetch(
      "http://localhost:5000/api/records",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
          },
          body: JSON.stringify({
            status: "For Billing",
          }),
        }
      );

      alert("Consultation completed!");
      navigate("/staff/queue");
    } else {
      alert("Failed to create consultation");
    }
  };

  return (
    <div className="layout">
      <div className="sidebar">
        <h2>Doctor Panel</h2>

        <ul>
          <li>
            <button onClick={() => navigate("/staff/queue")}>
              Queue
            </button>
          </li>

          <li>
            <button onClick={() => navigate(-1)}>
              Back
            </button>
          </li>
        </ul>
      </div>

      <div className="main-content">
        <h1 className="page-title">
          Doctor Consultation
        </h1>

        <form onSubmit={handleSubmit}>
          <input value={form.patientName} readOnly />

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

          <textarea
            name="prescription"
            placeholder="Prescription"
            value={form.prescription}
            onChange={handleChange}
          />

          <textarea
            name="consultationNotes"
            placeholder="Consultation Notes"
            value={form.consultationNotes}
            onChange={handleChange}
          />

          <input
            type="date"
            name="followUpDate"
            value={form.followUpDate}
            onChange={handleChange}
          />

          <input
            name="doctorName"
            placeholder="Doctor Name"
            value={form.doctorName}
            onChange={handleChange}
          />

          <button
            className="primary-btn"
            type="submit"
          >
            Complete Consultation
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreateConsultation;