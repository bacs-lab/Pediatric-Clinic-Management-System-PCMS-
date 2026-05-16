import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function ParentDashboard() {
  const [patients, setPatients] = useState([]);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    fetch(`http://localhost:5000/api/patients/guardian/${user.id}`)
      .then((res) => res.json())
      .then((data) => setPatients(data))
      .catch((err) => console.log(err));
  }, []);

  return (
    <div>
      <h1>Parent Dashboard</h1>
      <h2>My Children</h2>

      {patients.length === 0 ? (
        <p>No patients found.</p>
      ) : (
        patients.map((patient) => (
          <div
            key={patient._id}
            style={{
              border: "1px solid white",
              padding: "20px",
              marginBottom: "20px",
            }}
          >
            <h3>
              {patient.firstName} {patient.lastName}
            </h3>

            <p>Gender: {patient.gender}</p>
            <p>Blood Type: {patient.bloodType}</p>
            <p>Allergies: {patient.allergies}</p>

            <button
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
  );
}

export default ParentDashboard;