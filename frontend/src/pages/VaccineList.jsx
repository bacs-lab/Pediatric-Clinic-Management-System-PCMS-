import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function VaccineList() {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/vaccines", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setRecords(data));
  }, []);

  return (
    <div className="layout">
      <div className="sidebar">
        <h2>KIDS FIRST</h2>

        <ul>
          <li><button onClick={() => navigate("/staff/dashboard")}>Dashboard</button></li>
          <li><button onClick={() => navigate("/staff/create-vaccine")}>Add Vaccine Record</button></li>
          <li><button onClick={() => navigate("/staff/inventory")}>Inventory</button></li>
          <li><button onClick={() => navigate("/staff/reports")}>Reports</button></li>
        </ul>
      </div>

      <div className="main-content dashboard-bg">
        <div className="dashboard-hero">
          <div>
            <p className="eyebrow">PEDIATRIC IMMUNIZATION</p>
            <h1>Vaccine Records</h1>
            <span>Track administered vaccines, next doses, and vaccination status.</span>
          </div>

          <button
            className="primary-btn"
            onClick={() => navigate("/staff/create-vaccine")}
          >
            + Add Vaccine
          </button>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h2>Vaccination History</h2>
            <span style={{ color: "#64748b" }}>
              {records.length} vaccine record(s)
            </span>
          </div>

          <div className="table-container flat">
            <table>
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Vaccine</th>
                  <th>Date Given</th>
                  <th>Next Dose</th>
                  <th>Status</th>
                  <th>Administered By</th>
                </tr>
              </thead>

              <tbody>
                {records.length === 0 ? (
                  <tr>
                    <td colSpan="6">No vaccine records found.</td>
                  </tr>
                ) : (
                  records.map((record) => (
                    <tr key={record._id}>
                      <td><strong>{record.patientName}</strong></td>
                      <td>{record.vaccineName}</td>
                      <td>{new Date(record.vaccineDate).toLocaleDateString()}</td>
                      <td>
                        {record.nextDoseDate
                          ? new Date(record.nextDoseDate).toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td>
                        <span className={`status-badge ${record.status.toLowerCase()}`}>
                          {record.status}
                        </span>
                      </td>
                      <td>{record.administeredBy}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VaccineList;