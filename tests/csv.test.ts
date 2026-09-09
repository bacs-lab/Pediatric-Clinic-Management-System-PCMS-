import { describe, expect, it } from "vitest";
import { encodeCsv, encodeCsvCell } from "@/lib/reports/csv";

describe("CSV encoding", () => {
  it("quotes cells and escapes quotes", () => {
    expect(encodeCsvCell('Patient "A"')).toBe('"Patient ""A"""');
  });

  it("neutralizes spreadsheet formulas", () => {
    expect(encodeCsvCell("=IMPORTXML('http://example.test')")).toBe(
      "\"'=IMPORTXML('http://example.test')\"",
    );
  });

  it("uses stable headers from the first row", () => {
    expect(encodeCsv([{ date: "2026-08-22", count: 3 }])).toBe(
      '"date","count"\r\n"2026-08-22","3"\r\n',
    );
  });
});
