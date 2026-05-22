import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function CreateAppointment() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  const [patients, setPatients] = useState([]);

  const [form, setForm] = useState({
    patientId: "",
    guardianId: user.id,
    patientName: "",
    guardianName: "",
    appointmentDate: "",
    appointmentTime: "",
    reason: "",
  });

  useEffect(() => {
    fetch(`http://localhost:5000/api/patients/guardian/${user.id}`, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
})
      .then((res) => res.json())
      .then((data) => setPatients(data))
      .catch((err) => console.log(err));
  }, [user.id, token]);

  const handlePatientSelect = (e) => {
    const selectedPatient = patients.find(
      (patient) => patient._id === e.target.value
    );

    if (!selectedPatient) return;

    setForm({
      ...form,
      patientId: selectedPatient._id,
      patientName: `${selectedPatient.firstName} ${selectedPatient.lastName}`,
      guardianName: selectedPatient.guardianName,
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

  if (!form.patientId) {
    alert("Please select a child");
    return;
  }

  if (!form.appointmentDate) {
    alert("Please select appointment date");
    return;
  }

  if (!form.appointmentTime) {
    alert("Please select appointment time");
    return;
  }

  if (!form.reason.trim()) {
    alert("Please enter reason for appointment");
    return;
  }

  const res = await fetch(
    "http://localhost:5000/api/appointments",
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
      alert("Appointment request submitted!");
      navigate("/parent/dashboard");
    } else {
      const data = await res.json();
      alert(data.message || "Failed to create appointment");
    }
  };

  return (
    <div className="layout">
      <div className="sidebar">
        <h2>Parent Portal</h2>

        <ul>
          <li>
            <button onClick={() => navigate("/parent/dashboard")}>
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

      <div className="main-content">
        <h1 className="page-title">
          Request Appointment
        </h1>

        <form onSubmit={handleSubmit}>
          <select
            value={form.patientId}
            onChange={handlePatientSelect}
          >
            <option value="">Select Child</option>

            {patients.map((patient) => (
              <option
                key={patient._id}
                value={patient._id}
              >
                {patient.firstName} {patient.lastName}
              </option>
            ))}
          </select>

          <input
            value={form.patientName}
            readOnly
            placeholder="Patient Name"
          />

          <input
            type="date"
            name="appointmentDate"
            value={form.appointmentDate}
            onChange={handleChange}
          />

          <input
            type="time"
            name="appointmentTime"
            value={form.appointmentTime}
            onChange={handleChange}
          />

          <textarea
            name="reason"
            placeholder="Reason for appointment"
            value={form.reason}
            onChange={handleChange}
          />

          <button
            className="primary-btn"
            type="submit"
          >
            Request Appointment
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreateAppointment;