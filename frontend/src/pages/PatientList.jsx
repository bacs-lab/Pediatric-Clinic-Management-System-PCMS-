import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authFetch } from "../utils/authFetch";

function PatientList() {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    authFetch("http://localhost:5000/api/patients")
      .then((res) => res.json())
      .then((data) => setPatients(data));
  }, []);

  const filteredPatients = patients.filter((patient) =>
    `${patient.firstName} ${patient.lastName}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="dashboard-bg">
      <div className="dashboard-hero">
        <div>
          <p className="eyebrow">PATIENT MANAGEMENT</p>
          <h1>Patient List</h1>
          <span>View, search, and manage child patient records.</span>
        </div>

        <button
          className="primary-btn"
          onClick={() => navigate("/staff/create-patient")}
        >
          + Add Patient
        </button>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h2>Registered Patients</h2>

          <input
            type="text"
            className="search-input"
            placeholder="Search patient..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <p style={{ margin: "10px 0 20px", color: "#64748b" }}>
          {filteredPatients.length} patient(s) found
        </p>

        <div className="table-container flat">
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
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan="5">No patients found.</td>
                </tr>
              ) : (
                filteredPatients.map((patient) => (
                  <tr key={patient._id}>
                    <td>
                      <strong>
                        {patient.firstName} {patient.lastName}
                      </strong>
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default PatientList;