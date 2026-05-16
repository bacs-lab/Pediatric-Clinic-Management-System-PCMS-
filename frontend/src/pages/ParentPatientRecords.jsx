import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

function ParentPatientRecords() {
  const { patientId } = useParams();

  const [records, setRecords] = useState([]);

  useEffect(() => {
    fetch(`http://localhost:5000/api/records/patient/${patientId}`)
      .then((res) => res.json())
      .then((data) => setRecords(data))
      .catch((err) => console.log(err));
  }, []);

  return (
    <div>
      <h1>Medical History</h1>

      {records.length === 0 ? (
        <p>No medical records found.</p>
      ) : (
        records.map((record) => (
          <div
            key={record._id}
            style={{
              border: "1px solid white",
              padding: "20px",
              marginBottom: "20px",
            }}
          >
            <h3>{record.patientName}</h3>

            <p>Complaint: {record.chiefComplaint}</p>
            <p>Diagnosis: {record.diagnosis}</p>
            <p>Treatment: {record.treatment}</p>
            <p>Prescription: {record.prescription}</p>
            <p>Doctor: {record.doctorName}</p>
          </div>
        ))
      )}
    </div>
  );
}

export default ParentPatientRecords;