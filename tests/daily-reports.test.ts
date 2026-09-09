import { describe, expect, it } from "vitest";
import { buildDailyReport, reportFilename } from "@/lib/reports/daily";

describe("daily reports", () => {
  it("builds appointment CSV with expected headers", () => {
    expect(buildDailyReport("appointments").split("\r\n")[0]).toBe(
      '"appointment_id","patient","provider","starts_at","ends_at","status","reason"',
    );
  });

  it("builds billing CSV with money values", () => {
    expect(buildDailyReport("billing")).toContain("PHP");
  });

  it("builds inventory CSV with stock status", () => {
    expect(buildDailyReport("inventory")).toContain("low_stock");
  });

  it("uses a date-stamped safe filename", () => {
    expect(
      reportFilename("inventory", new Date("2026-08-22T00:00:00.000Z")),
    ).toBe("pcms-inventory-2026-08-22.csv");
  });
});
