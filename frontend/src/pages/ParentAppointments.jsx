import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function ParentAppointments() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    fetch(`http://localhost:5000/api/appointments/guardian/${user.id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setAppointments(data))
      .catch((err) => console.log(err));
  }, [user.id, token]);

  return (
    <div className="dashboard-bg">
        <div className="dashboard-hero">
          <div>
            <p className="eyebrow">PARENT APPOINTMENTS</p>
            <h1>My Appointments</h1>
            <span>Track appointment requests and clinic approval status.</span>
          </div>

          <button
            className="primary-btn"
            onClick={() => navigate("/parent/create-appointment")}
          >
            + Request Appointment
          </button>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h2>Appointment Schedule</h2>
            <span style={{ color: "#64748b" }}>
              {appointments.length} appointment(s)
            </span>
          </div>

          <div className="table-container flat">
            <table>
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Reason</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {appointments.length === 0 ? (
                  <tr>
                    <td colSpan="5">No appointments found.</td>
                  </tr>
                ) : (
                  appointments.map((appointment) => (
                    <tr key={appointment._id}>
                      <td><strong>{appointment.patientName}</strong></td>
                      <td>{new Date(appointment.appointmentDate).toLocaleDateString()}</td>
                      <td>{appointment.appointmentTime}</td>
                      <td>{appointment.reason}</td>
                      <td>
                        <span className={`status-badge ${appointment.status.toLowerCase()}`}>
                          {appointment.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
    </div>
  );
}

export default ParentAppointments;