import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

function ParentVaccines() {
  const navigate = useNavigate();
  const { patientId } = useParams();
  const [records, setRecords] = useState([]);

  useEffect(() => {
    fetch(`http://localhost:5000/api/vaccines/patient/${patientId}`)
      .then((res) => res.json())
      .then((data) => setRecords(data));
  }, []);

  return (
    <div className="layout">
      <div className="sidebar">
        <h2>Parent Portal</h2>
        <ul>
          <li><button onClick={() => navigate("/parent/dashboard")}>Dashboard</button></li>
          <li><button onClick={() => navigate(-1)}>Back</button></li>
        </ul>
      </div>

      <div className="main-content">
        <h1 className="page-title">Vaccination History</h1>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Vaccine</th>
                <th>Date Given</th>
                <th>Next Dose</th>
                <th>Status</th>
                <th>Remarks</th>
              </tr>
            </thead>

            <tbody>
              {records.map((record) => (
                <tr key={record._id}>
                  <td>{record.vaccineName}</td>
                  <td>{new Date(record.vaccineDate).toLocaleDateString()}</td>
                  <td>
                    {record.nextDoseDate
                      ? new Date(record.nextDoseDate).toLocaleDateString()
                      : "N/A"}
                  </td>
                  <td>{record.status}</td>
                  <td>{record.remarks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ParentVaccines;