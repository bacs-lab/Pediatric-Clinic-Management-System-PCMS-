import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function VaccineList() {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/vaccines")
      .then((res) => res.json())
      .then((data) => setRecords(data));
  }, []);

  return (
    <div className="layout">
      <div className="sidebar">
        <h2>PCMS Staff</h2>
        <ul>
          <li><button onClick={() => navigate("/staff/dashboard")}>Dashboard</button></li>
          <li><button onClick={() => navigate("/staff/create-vaccine")}>Add Vaccine Record</button></li>
        </ul>
      </div>

      <div className="main-content">
        <h1 className="page-title">Vaccine Records</h1>

        <div className="table-container">
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
              {records.map((record) => (
                <tr key={record._id}>
                  <td>{record.patientName}</td>
                  <td>{record.vaccineName}</td>
                  <td>{new Date(record.vaccineDate).toLocaleDateString()}</td>
                  <td>
                    {record.nextDoseDate
                      ? new Date(record.nextDoseDate).toLocaleDateString()
                      : "N/A"}
                  </td>
                  <td>{record.status}</td>
                  <td>{record.administeredBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default VaccineList;