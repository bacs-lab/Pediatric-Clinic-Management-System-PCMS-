import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
function ParentPatientRecords() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");

    fetch(`http://localhost:5000/api/records/patient/${patientId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setRecords(data))
      .catch((err) => console.log(err));
  }, [patientId]);

  return (
    <div className="dashboard-bg">
        <div className="dashboard-hero">
          <div>
            <p className="eyebrow">CHILD MEDICAL RECORDS</p>
            <h1>Medical History</h1>
            <span>View consultation history, diagnosis, treatment, and prescriptions.</span>
          </div>
        </div>

        {records.length === 0 ? (
          <div className="panel">
            <p>No medical records found.</p>
          </div>
        ) : (
          records.map((record) => (
            <div className="panel" key={record._id}>
              <div className="panel-header">
                <h2>{record.patientName}</h2>
                <span style={{ color: "#64748b" }}>
                  {record.createdAt
                    ? new Date(record.createdAt).toLocaleDateString()
                    : "Medical Record"}
                </span>
              </div>

              <div className="record-grid">
                <p><strong>Chief Complaint:</strong> {record.chiefComplaint || "N/A"}</p>
                <p><strong>Diagnosis:</strong> {record.diagnosis || "N/A"}</p>
                <p><strong>Treatment:</strong> {record.treatment || "N/A"}</p>
                <p><strong>Prescription:</strong> {record.prescription || "N/A"}</p>
                <p><strong>Doctor:</strong> {record.doctorName || "N/A"}</p>
                <p><strong>Follow-up:</strong> {record.followUpDate ? new Date(record.followUpDate).toLocaleDateString() : "N/A"}</p>
              </div>
            </div>
          ))
        )}
    </div>
  );
}

export default ParentPatientRecords;