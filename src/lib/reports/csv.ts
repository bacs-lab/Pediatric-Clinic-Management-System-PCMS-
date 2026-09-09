const FORMULA_PREFIXES = ["=", "+", "-", "@", "\t", "\r"];

export function encodeCsvCell(
  value: string | number | boolean | null | undefined,
): string {
  const raw = value === null || value === undefined ? "" : String(value);
  const safe = FORMULA_PREFIXES.some((prefix) => raw.startsWith(prefix))
    ? `'${raw}`
    : raw;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function encodeCsv(
  rows: Array<Record<string, string | number | boolean | null | undefined>>,
) {
  if (rows.length === 0) {
    return "";
  }

  const headers = Object.keys(rows[0] ?? {});
  const lines = [
    headers.map(encodeCsvCell).join(","),
    ...rows.map((row) =>
      headers.map((header) => encodeCsvCell(row[header])).join(","),
    ),
  ];

  return `${lines.join("\r\n")}\r\n`;
}
