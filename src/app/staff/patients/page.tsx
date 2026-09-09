import { AppShell } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { StatusPill } from "@/components/status-pill";
import { WorkflowFeedback } from "@/components/workflow-feedback";
import {
  createPatientAction,
  createPatientGuardianLinkAction,
} from "@/features/pcms/actions";
import { getPcmsReadModel } from "@/features/pcms/read-model";

export const dynamic = "force-dynamic";

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ workflow?: string }>;
}) {
  const readModel = await getPcmsReadModel();
  const resolvedSearchParams = await searchParams;

  return (
    <AppShell title="Patients">
      <div className="grid gap-5">
        <WorkflowFeedback value={resolvedSearchParams.workflow} />
        <section className="panel">
          <div className="panel-header">
            <h2 className="text-lg font-semibold">Register Patient</h2>
          </div>
          <form
            action={createPatientAction}
            className="mt-4 grid gap-3 md:grid-cols-4"
          >
            <label className="grid gap-1 text-sm">
              <span>Legal name</span>
              <input
                name="legalName"
                required
                className="rounded-md border border-clinic-line px-3 py-2"
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span>Birth date</span>
              <input
                name="birthDate"
                type="date"
                required
                className="rounded-md border border-clinic-line px-3 py-2"
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span>Sex</span>
              <select
                name="sex"
                required
                className="rounded-md border border-clinic-line px-3 py-2"
              >
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="intersex">Intersex</option>
                <option value="not_specified">Not specified</option>
              </select>
            </label>
            <div className="flex items-end">
              <button type="submit" className="primary-btn w-full">
                Save
              </button>
            </div>
          </form>
        </section>
        <section className="panel">
          <div className="panel-header">
            <h2 className="text-lg font-semibold">Link Guardian</h2>
          </div>
          <form
            action={createPatientGuardianLinkAction}
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
              <span>Guardian</span>
              <select
                name="guardianProfileId"
                required
                className="rounded-md border border-clinic-line px-3 py-2"
              >
                {readModel.guardianProfiles.map((guardian) => (
                  <option key={guardian.id} value={guardian.id}>
                    {guardian.displayName}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              <span>Relationship</span>
              <input
                name="relationship"
                required
                className="rounded-md border border-clinic-line px-3 py-2"
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span>Status</span>
              <select
                name="authorizationStatus"
                defaultValue="pending"
                className="rounded-md border border-clinic-line px-3 py-2"
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="revoked">Revoked</option>
              </select>
            </label>
            <div className="flex items-end">
              <button type="submit" className="primary-btn w-full">
                Link
              </button>
            </div>
          </form>
        </section>
        <DataTable
          columns={[
            "Name",
            "Birth Date",
            "Sex",
            "Guardian",
            "Allergies",
            "Immunizations",
            "Status",
          ]}
          rows={readModel.patients.map((patient) => [
            patient.name,
            patient.birthDate,
            patient.sex,
            patient.guardian,
            patient.allergies.length
              ? patient.allergies.join(", ")
              : "None recorded",
            patient.immunizations.join(", "),
            <StatusPill key={patient.id} value={patient.status} />,
          ])}
        />
      </div>
    </AppShell>
  );
}
