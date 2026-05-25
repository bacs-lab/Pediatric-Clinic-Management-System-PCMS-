const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString() : "N/A";

function GuardianRequestReviewModal({
  guardian,
  busy = false,
  onAccept,
  onReject,
  onClose,
}) {
  if (!guardian) return null;

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-content modal-content-wide"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Review Guardian Account</h2>
            <p className="modal-support-text">
              Approving this request activates the parent portal account.
            </p>
          </div>
          <span className="status-badge pending">Pending</span>
        </div>

        <div className="profile-grid request-review-grid">
          <section className="profile-card">
            <span className="profile-kicker">Parent / Guardian</span>
            <h2>{guardian.fullName || "Guardian request"}</h2>
            <div className="profile-facts">
              <p><strong>Email</strong><span>{guardian.email || "N/A"}</span></p>
              <p><strong>Contact Number</strong><span>{guardian.contactNumber || "N/A"}</span></p>
              <p><strong>Address</strong><span>{guardian.address || "N/A"}</span></p>
              <p><strong>Submitted On</strong><span>{formatDate(guardian.submittedAt || guardian.createdAt)}</span></p>
            </div>
          </section>

          <section className="profile-card">
            <span className="profile-kicker">Verification</span>
            <h2>Account Access</h2>
            <div className="profile-facts">
              <p><strong>Role</strong><span>Parent / Guardian</span></p>
              <p><strong>Status</strong><span>{guardian.status || "Pending"}</span></p>
              <p><strong>Profile ID</strong><span>{guardian._id}</span></p>
            </div>
          </section>
        </div>

        <div className="modal-buttons">
          <button className="secondary-btn" type="button" onClick={onClose} disabled={busy}>
            Close
          </button>
          <div className="request-review-actions">
            <button className="danger-btn" type="button" onClick={onReject} disabled={busy}>
              {busy ? "Saving..." : "Reject Account"}
            </button>
            <button className="primary-btn" type="button" onClick={onAccept} disabled={busy}>
              {busy ? "Saving..." : "Approve Account"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GuardianRequestReviewModal;
