import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Topbar from "../components/Topbar";

function ParentDashboard() {
  const [patients, setPatients] = useState([]);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  useEffect(() => {
    fetch(`http://localhost:5000/api/patients/guardian/${user.id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setPatients(data))
      .catch((err) => console.log(err));
  }, [user.id]);

  return (
    <div className="layout">
      <div className="sidebar">
        <h2>KIDS FIRST</h2>

        <ul>
          <li><button onClick={() => navigate("/parent/dashboard")}>Dashboard</button></li>
          <li><button onClick={() => navigate("/parent/create-appointment")}>Request Appointment</button></li>
          <li><button onClick={() => navigate("/parent/appointments")}>My Appointments</button></li>
          <li><button onClick={logout}>Logout</button></li>
        </ul>
      </div>

      <div className="main-content dashboard-bg">
        <Topbar />
        <div className="dashboard-hero">
          <div>
            <p className="eyebrow">PARENT PORTAL</p>
            <h1>Welcome, {user.name}</h1>
            <span>View your child’s clinic records, appointments, vaccines, and billing.</span>
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
            <h2>My Children</h2>
            <span style={{ color: "#64748b" }}>
              {patients.length} child record(s)
            </span>
          </div>

          {patients.length === 0 ? (
            <p>No child records found.</p>
          ) : (
            patients.map((patient) => (
              <div className="child-card" key={patient._id}>
                <div>
                  <h2>
                    {patient.firstName} {patient.lastName}
                  </h2>

                  <p><strong>Gender:</strong> {patient.gender}</p>
                  <p><strong>Blood Type:</strong> {patient.bloodType || "N/A"}</p>
                  <p><strong>Allergies:</strong> {patient.allergies || "None"}</p>
                </div>

                <div className="child-actions">
                  <button
                    className="primary-btn"
                    onClick={() =>
                      navigate(`/parent/patient/${patient._id}/records`)
                    }
                  >
                    Medical History
                  </button>

                  <button
                    className="primary-btn"
                    onClick={() =>
                      navigate(`/parent/patient/${patient._id}/billing`)
                    }
                  >
                    Billing
                  </button>

                  <button
                    className="primary-btn"
                    onClick={() =>
                      navigate(`/parent/patient/${patient._id}/vaccines`)
                    }
                  >
                    Vaccines
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default ParentDashboard;