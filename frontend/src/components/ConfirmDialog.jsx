function ConfirmDialog({
  title = "Confirm action",
  message,
  confirmLabel = "Continue",
  cancelLabel = "Cancel",
  tone = "danger",
  onConfirm,
  onCancel,
}) {
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className={`confirm-dialog confirm-${tone}`}>
        <div className="confirm-icon">
          <span className="ti ti-alert-triangle" />
        </div>
        <h2>{title}</h2>
        <p>{message}</p>
        <div className="confirm-actions">
          <button className="secondary-btn" type="button" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button className="danger-btn" type="button" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
