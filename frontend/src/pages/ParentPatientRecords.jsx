import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

function ParentPatientRecords() {
  const { patientId } = useParams();
  const navigate = useNavigate();

  const [records, setRecords] = useState([]);

  useEffect(() => {
    fetch(`http://localhost:5000/api/records/patient/${patientId}`)
      .then((res) => res.json())
      .then((data) => setRecords(data))
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
            <button onClick={() => navigate(-1)}>
              Back
            </button>
          </li>
        </ul>
      </div>

      <div className="main-content">
        <h1 className="page-title">Medical History</h1>

        {records.length === 0 ? (
          <p>No medical records found.</p>
        ) : (
          records.map((record) => (
            <div className="card" key={record._id}>
              <h2>{record.patientName}</h2>

              <p>
                <strong>Chief Complaint:</strong>{" "}
                {record.chiefComplaint}
              </p>

              <p>
                <strong>Diagnosis:</strong>{" "}
                {record.diagnosis}
              </p>

              <p>
                <strong>Treatment:</strong>{" "}
                {record.treatment}
              </p>

              <p>
                <strong>Prescription:</strong>{" "}
                {record.prescription}
              </p>

              <p>
                <strong>Doctor:</strong>{" "}
                {record.doctorName}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ParentPatientRecords;