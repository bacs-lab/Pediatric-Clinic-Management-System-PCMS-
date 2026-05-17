import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function AppointmentList() {
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);

  const fetchAppointments = () => {
    fetch("http://localhost:5000/api/appointments")
      .then((res) => res.json())
      .then((data) => setAppointments(data))
      .catch((err) => console.log(err));
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const updateStatus = async (id, status) => {
    const res = await fetch(
      `http://localhost:5000/api/appointments/${id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      }
    );

    if (res.ok) {
      fetchAppointments();
    } else {
      alert("Failed to update appointment");
    }
  };

  return (
    <div className="layout">
      <div className="sidebar">
        <h2>PCMS Staff</h2>

        <ul>
          <li>
            <button onClick={() => navigate("/staff/dashboard")}>
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
          Appointment Requests
        </h1>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Guardian</th>
                <th>Date</th>
                <th>Time</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {appointments.map((appointment) => (
                <tr key={appointment._id}>
                  <td>{appointment.patientName}</td>

                  <td>{appointment.guardianName}</td>

                  <td>
                    {new Date(
                      appointment.appointmentDate
                    ).toLocaleDateString()}
                  </td>

                  <td>{appointment.appointmentTime}</td>

                  <td>{appointment.reason}</td>

                  <td>{appointment.status}</td>

                  <td>
                    <button
                      className="primary-btn"
                      onClick={() =>
                        updateStatus(
                          appointment._id,
                          "Approved"
                        )
                      }
                    >
                      Approve
                    </button>

                    <button
                      className="danger-btn"
                      style={{ marginLeft: "10px" }}
                      onClick={() =>
                        updateStatus(
                          appointment._id,
                          "Cancelled"
                        )
                      }
                    >
                      Cancel
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AppointmentList;