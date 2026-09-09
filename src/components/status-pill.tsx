export function StatusPill({ value }: Readonly<{ value: string }>) {
  const normalized = value.toLowerCase();
  const tone =
    normalized === "paid" || normalized === "active" || normalized === "success"
      ? "success"
      : normalized === "draft" ||
          normalized === "requested" ||
          normalized === "waiting" ||
          normalized === "low_stock"
        ? "warning"
        : normalized === "void" ||
            normalized === "denied" ||
            normalized === "cancelled"
          ? "danger"
          : "neutral";

  return (
    <span className={`status-badge ${tone}`}>{value.replaceAll("_", " ")}</span>
  );
}
