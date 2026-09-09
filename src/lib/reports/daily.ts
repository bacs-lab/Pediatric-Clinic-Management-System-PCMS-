import { formatMoney, syntheticReadModel } from "@/features/demo/data";
import type { PcmsReadModel } from "@/features/demo/types";
import { formatPatientNameFromReadModel } from "@/features/pcms/read-model";
import { encodeCsv } from "@/lib/reports/csv";

export type ReportKind = "appointments" | "billing" | "inventory";

export const reportKinds: ReportKind[] = [
  "appointments",
  "billing",
  "inventory",
];

export function isReportKind(value: string): value is ReportKind {
  return reportKinds.includes(value as ReportKind);
}

export function buildDailyReport(
  kind: ReportKind,
  readModel: PcmsReadModel = syntheticReadModel,
) {
  if (kind === "appointments") {
    return encodeCsv(
      readModel.appointments.map((appointment) => ({
        appointment_id: appointment.id,
        patient: formatPatientNameFromReadModel(
          readModel,
          appointment.patientId,
        ),
        provider: appointment.provider,
        starts_at: appointment.startsAt,
        ends_at: appointment.endsAt,
        status: appointment.status,
        reason: appointment.reason,
      })),
    );
  }

  if (kind === "billing") {
    return encodeCsv(
      readModel.billingRecords.map((bill) => ({
        billing_id: bill.id,
        patient: formatPatientNameFromReadModel(readModel, bill.patientId),
        status: bill.status,
        currency: "PHP",
        total: formatMoney(bill.totalMinor),
      })),
    );
  }

  return encodeCsv(
    readModel.inventoryItems.map((item) => ({
      item_id: item.id,
      name: item.name,
      unit: item.unit,
      on_hand: item.onHand,
      reorder_level: item.reorderLevel,
      status: item.onHand <= item.reorderLevel ? "low_stock" : "active",
    })),
  );
}

export function reportFilename(kind: ReportKind, date = new Date()) {
  const day = date.toISOString().slice(0, 10);
  return `pcms-${kind}-${day}.csv`;
}
