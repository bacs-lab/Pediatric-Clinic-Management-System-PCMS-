import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import EmptyState from "../components/EmptyState";
import LoadingState from "../components/LoadingState";
import { apiUrl, authHeaders } from "../utils/api";

function ParentPatientRecords() {
  const { patientId } = useParams();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(apiUrl(`/api/records/patient/${patientId}`), {
      headers: authHeaders(),
    })
      .then((res) => res.json())
      .then((data) => setRecords(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, [patientId]);

  if (loading) return <LoadingState title="Loading medical history..." />;

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
        <EmptyState
          icon="ti ti-notes-off"
          title="No medical records found"
          message="Consultation notes will appear here after clinic visits."
        />
      ) : (
        <div className="timeline-list parent-records">
          {records.map((record) => (
            <article className="timeline-item record-item" key={record._id}>
              <span className="timeline-type visit">Visit</span>
              <div>
                <h3>{record.diagnosis || record.chiefComplaint || "Consultation"}</h3>
                <p><strong>Treatment:</strong> {record.treatment || "N/A"}</p>
                <p><strong>Prescription:</strong> {record.prescription || "N/A"}</p>
                <p><strong>Doctor:</strong> {record.doctorName || "N/A"}</p>
                <p>
                  <strong>Follow-up:</strong>{" "}
                  {record.followUpDate
                    ? new Date(record.followUpDate).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
              <time>
                {record.createdAt
                  ? new Date(record.createdAt).toLocaleDateString()
                  : "Medical Record"}
              </time>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default ParentPatientRecords;
