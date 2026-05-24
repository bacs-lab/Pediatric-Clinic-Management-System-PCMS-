const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString() : "N/A";

function AppointmentReviewModal({
  appointment,
  queueItem = null,
  busy = false,
  onApprove,
  onCancelRequest,
  onClose,
}) {
  if (!appointment) return null;

  const queueStage = queueItem?.status
    ? queueItem.status
    : appointment.status === "Approved"
      ? "Ready to queue"
      : "Starts after approval";

  const canApprove =
    !["Cancelled", "Completed"].includes(appointment.status) &&
    (appointment.status !== "Approved" || !queueItem);
  const canCancel = !["Cancelled", "Completed"].includes(appointment.status);
  const approveLabel =
    appointment.status === "Approved"
      ? "Send to Waiting Queue"
      : "Approve & Send to Queue";

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-content modal-content-wide"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Review Appointment Request</h2>
            <p className="modal-support-text">
              Approving this request places the patient directly into the waiting queue.
            </p>
          </div>
          <span className={`status-badge ${appointment.status.toLowerCase()}`}>
            {appointment.status}
          </span>
        </div>

        <div className="profile-grid request-review-grid">
          <section className="profile-card">
            <span className="profile-kicker">Appointment Details</span>
            <h2>{appointment.patientName}</h2>
            <div className="profile-facts">
              <p>
                <strong>Requested On</strong>
                <span>{formatDate(appointment.createdAt)}</span>
              </p>
              <p>
                <strong>Appointment Date</strong>
                <span>{formatDate(appointment.appointmentDate)}</span>
              </p>
              <p>
                <strong>Appointment Time</strong>
                <span>{appointment.appointmentTime || "N/A"}</span>
              </p>
              <p>
                <strong>Reason</strong>
                <span>{appointment.reason || "N/A"}</span>
              </p>
              <p>
                <strong>Remarks</strong>
                <span>{appointment.remarks || "No scheduling notes"}</span>
              </p>
            </div>
          </section>

          <section className="profile-card">
            <span className="profile-kicker">Parent / Guardian</span>
            <h2>{appointment.guardianName || "Guardian"}</h2>
            <div className="profile-facts">
              <p>
                <strong>Current Status</strong>
                <span>{appointment.status}</span>
              </p>
              <p>
                <strong>Queue Stage</strong>
                <span>{queueStage}</span>
              </p>
              <p>
                <strong>Last Updated</strong>
                <span>{formatDate(appointment.updatedAt)}</span>
              </p>
              {queueItem?.queueNumber ? (
                <p>
                  <strong>Queue Number</strong>
                  <span>#{queueItem.queueNumber}</span>
                </p>
              ) : null}
            </div>
          </section>
        </div>

        <div className="modal-buttons">
          <button className="secondary-btn" type="button" onClick={onClose} disabled={busy}>
            Close
          </button>
          <div className="request-review-actions">
            {canCancel && (
              <button
                className="danger-btn"
                type="button"
                onClick={onCancelRequest}
                disabled={busy}
              >
                {busy ? "Saving..." : "Cancel Request"}
              </button>
            )}
            {canApprove && (
              <button
                className="primary-btn"
                type="button"
                onClick={onApprove}
                disabled={busy}
              >
                {busy ? "Saving..." : approveLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AppointmentReviewModal;
