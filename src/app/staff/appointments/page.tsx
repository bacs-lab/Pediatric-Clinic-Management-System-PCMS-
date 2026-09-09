import { AppShell } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { StatusPill } from "@/components/status-pill";
import { WorkflowFeedback } from "@/components/workflow-feedback";
import {
  createAppointmentAction,
  updateAppointmentStatusAction,
} from "@/features/pcms/actions";
import {
  formatPatientNameFromReadModel,
  getPcmsReadModel,
} from "@/features/pcms/read-model";

export const dynamic = "force-dynamic";

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ workflow?: string }>;
}) {
  const readModel = await getPcmsReadModel();
  const resolvedSearchParams = await searchParams;

  return (
    <AppShell title="Appointments">
      <div className="grid gap-5">
        <WorkflowFeedback value={resolvedSearchParams.workflow} />
        <section className="panel">
          <div className="panel-header">
            <h2 className="text-lg font-semibold">Request Appointment</h2>
          </div>
          <form
            action={createAppointmentAction}
            className="mt-4 grid gap-3 lg:grid-cols-5"
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
            <label className="grid gap-1 text-sm">
              <span>Start</span>
              <input
                name="startsAt"
                type="datetime-local"
                required
                className="rounded-md border border-clinic-line px-3 py-2"
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span>End</span>
              <input
                name="endsAt"
                type="datetime-local"
                required
                className="rounded-md border border-clinic-line px-3 py-2"
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span>Reason</span>
              <input
                name="reason"
                required
                className="rounded-md border border-clinic-line px-3 py-2"
              />
            </label>
            <div className="flex items-end">
              <button type="submit" className="primary-btn w-full">
                Save
              </button>
            </div>
          </form>
        </section>
        <DataTable
          columns={[
            "Patient",
            "Provider",
            "Start",
            "End",
            "Reason",
            "Status",
            "Change",
          ]}
          rows={readModel.appointments.map((appointment) => [
            formatPatientNameFromReadModel(readModel, appointment.patientId),
            appointment.provider,
            new Date(appointment.startsAt).toLocaleString("en-PH", {
              timeZone: "Asia/Manila",
            }),
            new Date(appointment.endsAt).toLocaleString("en-PH", {
              timeZone: "Asia/Manila",
            }),
            appointment.reason,
            <StatusPill key={appointment.id} value={appointment.status} />,
            <form
              key={`${appointment.id}-status`}
              action={updateAppointmentStatusAction}
              className="flex gap-2"
            >
              <input
                type="hidden"
                name="appointmentId"
                value={appointment.id}
              />
              <select
                name="status"
                defaultValue={appointment.status}
                className="rounded-md border border-clinic-line px-2 py-1 text-sm"
              >
                <option value="requested">Requested</option>
                <option value="approved">Approved</option>
                <option value="checked_in">Checked in</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
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
