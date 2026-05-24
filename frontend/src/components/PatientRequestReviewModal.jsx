function PatientRequestReviewModal({
  patient,
  busy = false,
  onAccept,
  onReject,
  onClose,
}) {
  if (!patient) return null;

  const age = patient.birthDate
    ? Math.max(
        new Date().getFullYear() - new Date(patient.birthDate).getFullYear(),
        0
      )
    : "N/A";

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-content modal-content-wide"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Review Child Request</h2>
            <p className="modal-support-text">
              Pending child profile request from {patient.guardianName || "a parent"}.
            </p>
          </div>
          <span className="status-badge pending">Pending</span>
        </div>

        <div className="profile-grid request-review-grid">
          <section className="profile-card">
            <span className="profile-kicker">Child Details</span>
            <h2>
              {patient.firstName} {patient.lastName}
            </h2>
            <div className="profile-facts">
              <p><strong>Birth Date</strong><span>{patient.birthDate ? new Date(patient.birthDate).toLocaleDateString() : "N/A"}</span></p>
              <p><strong>Age</strong><span>{age === "N/A" ? age : `${age} yrs`}</span></p>
              <p><strong>Gender</strong><span>{patient.gender || "N/A"}</span></p>
              <p><strong>Blood Type</strong><span>{patient.bloodType || "N/A"}</span></p>
              <p><strong>Allergies</strong><span>{patient.allergies || "None recorded"}</span></p>
              <p><strong>Notes</strong><span>{patient.notes || "N/A"}</span></p>
            </div>
          </section>

          <section className="profile-card">
            <span className="profile-kicker">Parent / Guardian</span>
            <h2>{patient.guardianName || "Guardian request"}</h2>
            <div className="profile-facts">
              <p><strong>Relationship</strong><span>{patient.relationshipToChild || "N/A"}</span></p>
              <p><strong>Contact Number</strong><span>{patient.contactNumber || "N/A"}</span></p>
              <p><strong>Emergency Contact</strong><span>{patient.emergencyContact || "N/A"}</span></p>
              <p><strong>Address</strong><span>{patient.address || "N/A"}</span></p>
              <p><strong>Requested On</strong><span>{patient.createdAt ? new Date(patient.createdAt).toLocaleDateString() : "N/A"}</span></p>
            </div>
          </section>
        </div>

        <div className="modal-buttons">
          <button className="secondary-btn" type="button" onClick={onClose} disabled={busy}>
            Close
          </button>
          <div className="request-review-actions">
            <button className="danger-btn" type="button" onClick={onReject} disabled={busy}>
              {busy ? "Saving..." : "Reject Request"}
            </button>
            <button className="primary-btn" type="button" onClick={onAccept} disabled={busy}>
              {busy ? "Saving..." : "Accept Request"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PatientRequestReviewModal;
