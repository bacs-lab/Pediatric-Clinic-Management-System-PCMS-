import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

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
    fetch(`http://localhost:5000/api/patients/guardian/${user.id}`)
      .then((res) => res.json())
      .then((data) => setPatients(data))
      .catch((err) => console.log(err));
  }, []);

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
            <button onClick={logout}>Logout</button>
          </li>
        </ul>
        <li>
  <button
    onClick={() =>
      navigate("/parent/create-appointment")
    }
  >
    Request Appointment
  </button>
</li>
      </div>

      <div className="main-content">
        <h1 className="page-title">Parent Dashboard</h1>

        <div className="card">
          <h2>My Children</h2>
        </div>

        {patients.length === 0 ? (
          <p>No patients found.</p>
        ) : (
          patients.map((patient) => (
            <div className="card" key={patient._id}>
              <h2>
                {patient.firstName} {patient.lastName}
              </h2>

              <p>
                <strong>Gender:</strong> {patient.gender}
              </p>

              <p>
                <strong>Blood Type:</strong> {patient.bloodType}
              </p>

              <p>
                <strong>Allergies:</strong> {patient.allergies}
              </p>

              <button
                className="primary-btn"
                onClick={() =>
                  navigate(`/parent/patient/${patient._id}/records`)
                }
              >
                View Medical History
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ParentDashboard;