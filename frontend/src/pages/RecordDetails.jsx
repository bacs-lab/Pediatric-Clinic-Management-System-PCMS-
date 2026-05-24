import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ConfirmDialog from "../components/ConfirmDialog";
import LoadingState from "../components/LoadingState";
import EditRecord from "./EditRecord";
import { apiUrl, authHeaders } from "../utils/api";
import { notify } from "../utils/notify";
import { EMR_WRITE_ROLES } from "../utils/roles";

const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString() : "N/A";

function RecordDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const canWriteEmr = EMR_WRITE_ROLES.includes(user.role);
  const canDeleteEmr = EMR_WRITE_ROLES.includes(user.role);
  const [record, setRecord] = useState(null);
  const [patient, setPatient] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadRecord = async () => {
      try {
        const recordRes = await fetch(apiUrl(`/api/records/${id}`), {
          headers: authHeaders(),
        });
        const recordData = await recordRes.json();

        if (!mounted) return;
        setRecord(recordData);

        if (!recordData?.patientId) {
          setPatient(null);
          return;
        }

        const patientRes = await fetch(apiUrl(`/api/patients/${recordData.patientId}`), {
          headers: authHeaders(),
        });
        const patientData = await patientRes.json();

        if (mounted && patientRes.ok) {
          setPatient(patientData);
        }
      } catch (err) {
        console.log(err);
      }
    };

    loadRecord();

    return () => {
      mounted = false;
    };
  }, [id]);

  const handleDelete = async () => {
    const res = await fetch(apiUrl(`/api/records/${id}`), {
      method: "DELETE",
      headers: authHeaders(),
    });

    if (res.ok) {
      notify("Medical record deleted!");
      navigate("/staff/records");
    } else {
      setDeleteOpen(false);
      notify("Failed to delete record");
    }
  };

  if (!record) return <LoadingState title="Loading medical record..." />;

  return (
    <div className="dashboard-bg">
      <div className="dashboard-hero">
        <div>
          <p className="eyebrow">MEDICAL RECORD</p>
          <h1 className="page-heading">
            <i className="page-heading-icon ti ti-notes-medical" aria-hidden="true" />
            Record Details
          </h1>
          <span>
            {record.patientName} - Visit date: {formatDate(record.visitDate || record.createdAt)}
          </span>
        </div>
        <div className="detail-actions">
          <button
            className="secondary-btn"
            onClick={() => navigate("/staff/records")}
          >
            <span className="ti ti-arrow-left" />
            Back
          </button>
          {canWriteEmr && (
            <button
              className="primary-btn"
              onClick={() => setEditOpen(true)}
            >
              <span className="ti ti-pencil" />
              Edit Record
            </button>
          )}
          {canDeleteEmr && (
            <button
              className="danger-btn"
              onClick={() => setDeleteOpen(true)}
            >
              <span className="ti ti-trash" />
              Delete Record
            </button>
          )}
        </div>
      </div>

      <div className="record-detail-grid">
        <section className="profile-card record-patient-card">
          <span className="profile-kicker">Patient Summary</span>
          <div className="record-patient-heading">
            <div className="record-avatar">
              <span className="ti ti-user-heart" />
            </div>
            <div>
              <h2>{record.patientName}</h2>
              <p>{record.gender || "No gender recorded"} - {record.age ?? "N/A"} yrs</p>
            </div>
          </div>

          <div className="profile-facts">
            <p><strong>Parent / Guardian</strong><span>{patient?.guardianName || "N/A"}</span></p>
            <p><strong>Relationship</strong><span>{patient?.relationshipToChild || "N/A"}</span></p>
            <p><strong>Phone</strong><span>{record.phone || "N/A"}</span></p>
            <p><strong>Address</strong><span>{record.address || "N/A"}</span></p>
            <p><strong>Doctor</strong><span>{record.doctorName || "N/A"}</span></p>
            <p><strong>Visit Date</strong><span>{formatDate(record.visitDate || record.createdAt)}</span></p>
          </div>
        </section>

        <section className="profile-card record-care-card">
          <span className="profile-kicker">Clinical Notes</span>
          <h2>Consultation Details</h2>
          <div className="record-note-list">
            <div>
              <strong>Chief Complaint</strong>
              <p>{record.chiefComplaint || "No chief complaint recorded."}</p>
            </div>
            <div>
              <strong>Diagnosis</strong>
              <p>{record.diagnosis || "No diagnosis recorded."}</p>
            </div>
            <div>
              <strong>Treatment</strong>
              <p>{record.treatment || "No treatment recorded."}</p>
            </div>
            <div>
              <strong>Prescription</strong>
              <p>{record.prescription || "No prescription recorded."}</p>
            </div>
          </div>
        </section>
      </div>

      {editOpen && (
        <div className="modal-overlay" onClick={() => setEditOpen(false)}>
          <div
            className="modal-content modal-content-wide"
            onClick={(event) => event.stopPropagation()}
          >
            <EditRecord
              embedded
              recordId={record._id}
              onCancel={() => setEditOpen(false)}
              onSaved={(updatedRecord) => {
                setRecord(updatedRecord);
                setEditOpen(false);
              }}
            />
          </div>
        </div>
      )}

      {deleteOpen && (
        <ConfirmDialog
          title="Delete medical record?"
          message={`This will permanently delete the medical record for ${record.patientName}.`}
          confirmLabel="Delete Record"
          onCancel={() => setDeleteOpen(false)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}

export default RecordDetails;
