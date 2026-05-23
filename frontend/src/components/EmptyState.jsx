function EmptyState({
  icon = "ti ti-folder-open",
  title = "Nothing here yet",
  message = "Records will appear here once they are added.",
  actionLabel,
  onAction,
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <span className={icon} />
      </div>
      <h3>{title}</h3>
      <p>{message}</p>
      {actionLabel && onAction && (
        <button className="primary-btn" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export default EmptyState;
