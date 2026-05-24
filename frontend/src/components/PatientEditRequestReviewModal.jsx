const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString() : "N/A";

const fieldDefinitions = [
  { key: "firstName", label: "First Name" },
  { key: "lastName", label: "Last Name" },
  { key: "birthDate", label: "Birth Date", formatter: formatDate },
  { key: "gender", label: "Gender" },
  { key: "relationshipToChild", label: "Relationship" },
  { key: "contactNumber", label: "Contact Number" },
  { key: "emergencyContact", label: "Emergency Contact" },
  { key: "address", label: "Address" },
  { key: "bloodType", label: "Blood Type" },
  { key: "allergies", label: "Allergies" },
  { key: "notes", label: "Notes" },
];

function PatientEditRequestReviewModal({
  patient,
  busy = false,
  onAccept,
  onReject,
  onClose,
}) {
  if (!patient) return null;

  const pendingUpdate = patient.pendingUpdate || {};
  const changedFields = fieldDefinitions.filter((field) => {
    const currentValue = field.formatter
      ? field.formatter(patient[field.key])
      : patient[field.key] || "N/A";
    const requestedValue = field.formatter
      ? field.formatter(pendingUpdate[field.key])
      : pendingUpdate[field.key] || "N/A";

    return currentValue !== requestedValue;
  });

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-content modal-content-wide"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Review Patient Detail Update</h2>
            <p className="modal-support-text">
              Parent-submitted profile update for {patient.firstName} {patient.lastName}.
            </p>
          </div>
          <span className="status-badge pending">Pending</span>
        </div>

        <div className="profile-grid request-review-grid">
          <section className="profile-card">
            <span className="profile-kicker">Current Record</span>
            <h2>
              {patient.firstName} {patient.lastName}
            </h2>
            <div className="profile-facts">
              <p>
                <strong>Parent / Guardian</strong>
                <span>{patient.guardianName || "N/A"}</span>
              </p>
              {fieldDefinitions.map((field) => (
                <p key={field.key}>
                  <strong>{field.label}</strong>
                  <span>
                    {field.formatter
                      ? field.formatter(patient[field.key])
                      : patient[field.key] || "N/A"}
                  </span>
                </p>
              ))}
            </div>
          </section>

          <section className="profile-card">
            <span className="profile-kicker">Requested Changes</span>
            <h2>Pending Update</h2>
            {changedFields.length === 0 ? (
              <p className="modal-support-text">
                No changed fields were found in this request.
              </p>
            ) : (
              <div className="profile-facts">
                {changedFields.map((field) => (
                  <p key={field.key}>
                    <strong>{field.label}</strong>
                    <span>
                      {field.formatter
                        ? field.formatter(pendingUpdate[field.key])
                        : pendingUpdate[field.key] || "N/A"}
                    </span>
                  </p>
                ))}
                <p>
                  <strong>Requested On</strong>
                  <span>{formatDate(patient.updatedAt)}</span>
                </p>
              </div>
            )}
          </section>
        </div>

        <div className="modal-buttons">
          <button
            className="secondary-btn"
            type="button"
            onClick={onClose}
            disabled={busy}
          >
            Close
          </button>
          <div className="request-review-actions">
            <button
              className="danger-btn"
              type="button"
              onClick={onReject}
              disabled={busy}
            >
              {busy ? "Saving..." : "Reject Update"}
            </button>
            <button
              className="primary-btn"
              type="button"
              onClick={onAccept}
              disabled={busy}
            >
              {busy ? "Saving..." : "Approve Update"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PatientEditRequestReviewModal;
