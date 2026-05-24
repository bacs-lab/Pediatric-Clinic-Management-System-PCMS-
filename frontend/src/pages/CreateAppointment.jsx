import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl, authHeaders } from "../utils/api";
import { notify } from "../utils/notify";
function CreateAppointment({ embedded = false, onCancel, onSaved }) {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));

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
    fetch(apiUrl(`/api/patients/guardian/${user.id}`), {
      headers: authHeaders(),
    })
      .then((res) => res.json())
      .then((data) =>
        setPatients(
          Array.isArray(data)
            ? data.filter((patient) => (patient.status || "Active") === "Active")
            : []
        )
      )
      .catch((err) => console.log(err));
  }, [user.id]);

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
    notify("Please select a child");
    return;
  }

  if (!form.appointmentDate) {
    notify("Please select appointment date");
    return;
  }

  if (!form.appointmentTime) {
    notify("Please select appointment time");
    return;
  }

  if (!form.reason.trim()) {
    notify("Please enter reason for appointment");
    return;
  }

  const res = await fetch(
    apiUrl("/api/appointments"),
    {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(form),
    }
  );

    if (res.ok) {
      notify("Appointment request submitted!");
      if (onSaved) onSaved();
      else navigate("/parent/dashboard");
    } else {
      const data = await res.json();
      notify(data.message || "Failed to create appointment");
    }
  };

  return (
    <>
        <h1 className={embedded ? "modal-title" : "page-title"}>
          Request Appointment
        </h1>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Child</label>
            <select value={form.patientId} onChange={handlePatientSelect}>
              <option value="">Select Child</option>
              {patients.map((patient) => (
                <option key={patient._id} value={patient._id}>
                  {patient.firstName} {patient.lastName}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Appointment Date</label>
            <input
              type="date"
              name="appointmentDate"
              value={form.appointmentDate}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Appointment Time</label>
            <input
              type="time"
              name="appointmentTime"
              value={form.appointmentTime}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Reason</label>
            <textarea
              name="reason"
              placeholder="Reason for appointment"
              value={form.reason}
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
              Request Appointment
            </button>
          </div>
        </form>
      </>
  );
}

export default CreateAppointment;
