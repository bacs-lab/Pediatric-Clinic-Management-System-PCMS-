const escapeCell = (value) => {
  const text = value == null ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
};

export const exportCsv = (filename, rows, columns) => {
  const header = columns.map((column) => escapeCell(column.label)).join(",");
  const body = rows
    .map((row) =>
      columns.map((column) => escapeCell(column.value(row))).join(",")
    )
    .join("\n");

  const blob = new Blob([`${header}\n${body}`], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};
