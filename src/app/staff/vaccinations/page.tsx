import { AppShell } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { StatusPill } from "@/components/status-pill";
import { WorkflowFeedback } from "@/components/workflow-feedback";
import { createVaccinationRecordAction } from "@/features/pcms/actions";
import {
  formatPatientNameFromReadModel,
  getPcmsReadModel,
} from "@/features/pcms/read-model";

export const dynamic = "force-dynamic";

export default async function VaccinationsPage({
  searchParams,
}: {
  searchParams: Promise<{ workflow?: string }>;
}) {
  const readModel = await getPcmsReadModel();
  const resolvedSearchParams = await searchParams;
  const inventoryNameById = new Map(
    readModel.inventoryItems.map((item) => [item.id, item.name]),
  );

  return (
    <AppShell title="Vaccinations">
      <div className="grid gap-5">
        <WorkflowFeedback value={resolvedSearchParams.workflow} />
        <section className="panel">
          <div className="panel-header">
            <h2 className="text-lg font-semibold">Record Vaccination</h2>
          </div>
          <form
            action={createVaccinationRecordAction}
            className="mt-4 grid gap-3"
          >
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <label className="grid gap-1 text-sm">
                <span>Patient</span>
                <select
                  name="patientId"
                  required
                  className="rounded-md border border-clinic-line px-3 py-2"
                >
                  {readModel.patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-sm">
                <span>Vaccine</span>
                <input
                  name="vaccineName"
                  required
                  className="rounded-md border border-clinic-line px-3 py-2"
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span>Dose</span>
                <input
                  name="doseLabel"
                  required
                  placeholder="Dose 1"
                  className="rounded-md border border-clinic-line px-3 py-2"
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span>Administered at</span>
                <input
                  name="administeredAt"
                  type="datetime-local"
                  required
                  className="rounded-md border border-clinic-line px-3 py-2"
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span>Inventory item</span>
                <select
                  name="inventoryItemId"
                  className="rounded-md border border-clinic-line px-3 py-2"
                >
                  <option value="">No stock movement</option>
                  {readModel.inventoryItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.onHand} {item.unit})
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-sm">
                <span>Lot number</span>
                <input
                  name="lotNumber"
                  className="rounded-md border border-clinic-line px-3 py-2"
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span>Route</span>
                <input
                  name="route"
                  placeholder="IM"
                  className="rounded-md border border-clinic-line px-3 py-2"
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span>Site</span>
                <input
                  name="site"
                  placeholder="Left deltoid"
                  className="rounded-md border border-clinic-line px-3 py-2"
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span>Next due</span>
                <input
                  name="nextDueAt"
                  type="date"
                  className="rounded-md border border-clinic-line px-3 py-2"
                />
              </label>
            </div>
            <label className="grid gap-1 text-sm">
              <span>Notes</span>
              <textarea
                name="notes"
                rows={3}
                className="rounded-md border border-clinic-line px-3 py-2"
              />
            </label>
            <button type="submit" className="primary-btn">
              Record Vaccination
            </button>
          </form>
        </section>
        <DataTable
          columns={[
            "Patient",
            "Vaccine",
            "Dose",
            "Inventory",
            "Administered",
            "Next Due",
            "Status",
          ]}
          rows={readModel.vaccinationRecords.map((record) => [
            formatPatientNameFromReadModel(readModel, record.patientId),
            record.vaccineName,
            record.doseLabel,
            record.inventoryItemId
              ? (inventoryNameById.get(record.inventoryItemId) ?? "Linked item")
              : "No stock movement",
            new Date(record.administeredAt).toLocaleString("en-PH", {
              timeZone: "Asia/Manila",
            }),
            record.nextDueAt ?? "None",
            <StatusPill key={record.id} value={record.status} />,
          ])}
        />
        <DataTable
          columns={["Patient", "Recorded Immunizations"]}
          rows={readModel.patients.map((patient) => [
            patient.name,
            patient.immunizations.length
              ? patient.immunizations.join(", ")
              : "No recorded immunizations",
          ])}
        />
      </div>
    </AppShell>
  );
}
