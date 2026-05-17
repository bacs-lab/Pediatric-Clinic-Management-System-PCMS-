import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function ParentAppointments() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    fetch(`http://localhost:5000/api/appointments/guardian/${user.id}`)
      .then((res) => res.json())
      .then((data) => setAppointments(data))
      .catch((err) => console.log(err));
  }, []);

  return (
    <div className="layout">
      <div className="sidebar">
        <h2>Parent Portal</h2>
        <ul>
          <li><button onClick={() => navigate("/parent/dashboard")}>Dashboard</button></li>
          <li><button onClick={() => navigate("/parent/create-appointment")}>Request Appointment</button></li>
          <li><button onClick={() => navigate(-1)}>Back</button></li>
        </ul>
      </div>

      <div className="main-content">
        <h1 className="page-title">My Appointments</h1>

        <div className="table-container">
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
              {appointments.map((appointment) => (
                <tr key={appointment._id}>
                  <td>{appointment.patientName}</td>
                  <td>{new Date(appointment.appointmentDate).toLocaleDateString()}</td>
                  <td>{appointment.appointmentTime}</td>
                  <td>{appointment.reason}</td>
                  <td>{appointment.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ParentAppointments;