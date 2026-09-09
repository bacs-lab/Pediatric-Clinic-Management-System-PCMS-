import { AppShell } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { StatusPill } from "@/components/status-pill";
import { WorkflowFeedback } from "@/components/workflow-feedback";
import {
  checkInQueueAction,
  updateQueueStateAction,
} from "@/features/pcms/actions";
import {
  formatPatientNameFromReadModel,
  getPcmsReadModel,
} from "@/features/pcms/read-model";

export const dynamic = "force-dynamic";

export default async function QueuePage({
  searchParams,
}: {
  searchParams: Promise<{ workflow?: string }>;
}) {
  const readModel = await getPcmsReadModel();
  const resolvedSearchParams = await searchParams;
  const queuedAppointmentIds = new Set(
    readModel.queueEntries
      .map((entry) => entry.appointmentId)
      .filter((id): id is string => Boolean(id)),
  );
  const checkInAppointments = readModel.appointments.filter(
    (appointment) =>
      !queuedAppointmentIds.has(appointment.id) &&
      ["approved", "requested"].includes(appointment.status),
  );

  return (
    <AppShell title="Queue">
      <div className="grid gap-5">
        <WorkflowFeedback value={resolvedSearchParams.workflow} />
        <section className="panel">
          <div className="panel-header">
            <h2 className="text-lg font-semibold">Check In</h2>
          </div>
          <form
            action={checkInQueueAction}
            className="mt-4 grid gap-3 lg:grid-cols-4"
          >
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
            <label className="grid gap-1 text-sm lg:col-span-2">
              <span>Appointment</span>
              <select
                name="appointmentId"
                className="rounded-md border border-clinic-line px-3 py-2"
              >
                <option value="">Walk-in</option>
                {checkInAppointments.map((appointment) => (
                  <option key={appointment.id} value={appointment.id}>
                    {formatPatientNameFromReadModel(
                      readModel,
                      appointment.patientId,
                    )}{" "}
                    -{" "}
                    {new Date(appointment.startsAt).toLocaleString("en-PH", {
                      timeZone: "Asia/Manila",
                    })}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-end">
              <button type="submit" className="primary-btn w-full">
                Check In
              </button>
            </div>
          </form>
        </section>
        <DataTable
          columns={["Queue #", "Patient", "Appointment", "State", "Change"]}
          rows={readModel.queueEntries.map((entry) => [
            entry.queueNumber,
            formatPatientNameFromReadModel(readModel, entry.patientId),
            entry.appointmentId ? "Linked" : "Walk-in",
            <StatusPill key={entry.id} value={entry.state} />,
            <form
              key={`${entry.id}-state`}
              action={updateQueueStateAction}
              className="flex gap-2"
            >
              <input type="hidden" name="queueEntryId" value={entry.id} />
              <select
                name="state"
                defaultValue={entry.state}
                className="rounded-md border border-clinic-line px-2 py-1 text-sm"
              >
                <option value="waiting">Waiting</option>
                <option value="assessing">Assessing</option>
                <option value="consulting">Consulting</option>
                <option value="billing">Billing</option>
                <option value="completed">Completed</option>
              </select>
              <button type="submit" className="secondary-btn">
                Apply
              </button>
            </form>,
          ])}
        />
      </div>
    </AppShell>
  );
}
