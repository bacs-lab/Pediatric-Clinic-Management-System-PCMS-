import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function ParentDashboard() {
  const [patients, setPatients] = useState([]);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user")) || {};

  useEffect(() => {
    if (!user.id) return;

    fetch(`http://localhost:5000/api/patients/guardian/${user.id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        // Ensure data is an array before setting state
        setPatients(Array.isArray(data) ? data : []);
      })
      .catch((err) => console.error("Error fetching patients:", err));
  }, [user.id]);

  return (
    <div className="dashboard-bg">
      
      <div className="dashboard-hero">
        <div>
          <p className="eyebrow">PARENT PORTAL</p>
          <h1>Welcome, {user.name || "Parent"}</h1>
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
          <p style={{ padding: "20px", textAlign: "center" }}>No child records found.</p>
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
                  onClick={() => navigate(`/parent/patient/${patient._id}/records`)}
                >
                  Medical History
                </button>

                <button
                  className="primary-btn"
                  onClick={() => navigate(`/parent/patient/${patient._id}/billing`)}
                >
                  Billing
                </button>

                <button
                  className="primary-btn"
                  onClick={() => navigate(`/parent/patient/${patient._id}/vaccines`)}
                >
                  Vaccines
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ParentDashboard;