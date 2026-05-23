function LoadingState({ title = "Loading records..." }) {
  return (
    <div className="loading-state">
      <div className="loader-ring" />
      <p>{title}</p>
    </div>
  );
}

export default LoadingState;
