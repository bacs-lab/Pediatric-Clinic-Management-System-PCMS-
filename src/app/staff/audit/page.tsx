import { AppShell } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { StatusPill } from "@/components/status-pill";
import { getPcmsReadModel } from "@/features/pcms/read-model";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  const readModel = await getPcmsReadModel();

  return (
    <AppShell title="Audit">
      <DataTable
        columns={["Occurred", "Actor", "Action", "Resource", "Result"]}
        rows={readModel.auditEvents.map((event) => [
          new Date(event.occurredAt).toLocaleString("en-PH", {
            timeZone: "Asia/Manila",
          }),
          event.actor,
          event.action,
          event.resource,
          <StatusPill key={event.id} value={event.result} />,
        ])}
      />
    </AppShell>
  );
}
