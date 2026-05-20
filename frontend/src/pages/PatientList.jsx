import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function PatientList() {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
  fetch("http://localhost:5000/api/patients", {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  })
    .then((res) => res.json())
    .then((data) => setPatients(data));
}, []);

const filteredPatients = patients.filter((patient) =>
  `${patient.firstName} ${patient.lastName}`
    .toLowerCase()
    .includes(search.toLowerCase())
);

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
            <button onClick={() => navigate("/staff/create-patient")}>
              Add Patient
            </button>
          </li>
        </ul>
      </div>

      <div className="main-content">
        <h1 className="page-title">Patients</h1>
        <input
  type="text"
  placeholder="Search patient..."
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  style={{
    marginBottom: "20px",
    padding: "10px",
    width: "300px",
  }}
/>

        <div className="table-container">

          <table>
            <thead>
              <tr>
                <th>Child Name</th>
                <th>Gender</th>
                <th>Guardian</th>
                <th>Contact</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredPatients.map((patient) => (
                <tr key={patient._id}>
                  <td>
                    {patient.firstName} {patient.lastName}
                  </td>
                  <td>{patient.gender}</td>
                  <td>{patient.guardianName}</td>
                  <td>{patient.contactNumber}</td>
                  <td>
                    <button
                      className="primary-btn"
                      onClick={() =>
                        navigate(`/staff/create-record?patientId=${patient._id}`)
                      }
                    >
                      Add EMR
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

export default PatientList;