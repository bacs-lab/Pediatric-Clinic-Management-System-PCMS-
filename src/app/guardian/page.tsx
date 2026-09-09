import {
  CalendarDays,
  Download,
  FileText,
  ReceiptText,
  Syringe,
} from "lucide-react";
import Link from "next/link";
import { DataTable } from "@/components/data-table";
import { StatusPill } from "@/components/status-pill";
import { WorkflowFeedback } from "@/components/workflow-feedback";
import { formatMoney } from "@/features/demo/data";
import { upsertGuardianProfileAction } from "@/features/pcms/actions";
import { getPcmsReadModel } from "@/features/pcms/read-model";
import { requireMfaEnrollment } from "@/lib/auth/mfa";
import { formatClinicalAttachmentSize } from "@/lib/clinical-attachments";

export const dynamic = "force-dynamic";

export default async function GuardianPage({
  searchParams,
}: {
  searchParams: Promise<{ workflow?: string }>;
}) {
  await requireMfaEnrollment("/guardian/security");

  const readModel = await getPcmsReadModel();
  const resolvedSearchParams = await searchParams;
  const linkedPatientIds = new Set(
    readModel.patientGuardianLinks
      .filter((link) => link.authorizationStatus === "approved")
      .map((link) => link.patientId),
  );
  const linkedPatients = readModel.patients.filter((patient) =>
    linkedPatientIds.has(patient.id),
  );
  const linkedIds = new Set(linkedPatients.map((patient) => patient.id));

  return (
    <main className="pcms-shell">
      <div className="pcms-topbar">
        <div>
          <p className="eyebrow">Guardian portal</p>
          <h1>Linked Children</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/guardian/security" className="secondary-btn">
            Security
          </Link>
          <Link href="/" className="secondary-btn">
            Home
          </Link>
        </div>
      </div>
      <div className="grid gap-5">
        <WorkflowFeedback value={resolvedSearchParams.workflow} />
        <section className="panel">
          <div className="panel-header">
            <h2 className="text-lg font-semibold">Guardian Profile</h2>
          </div>
          <form
            action={upsertGuardianProfileAction}
            className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]"
          >
            <label className="grid gap-1 text-sm">
              <span>Contact number</span>
              <input
                name="contactNumber"
                required
                className="rounded-md border border-clinic-line px-3 py-2"
              />
            </label>
            <div className="flex items-end">
              <button type="submit" className="primary-btn">
                Save Profile
              </button>
            </div>
          </form>
        </section>
        <div className="stats-row">
          {[
            { label: "Children", value: linkedPatients.length, icon: FileText },
            {
              label: "Appointments",
              value: readModel.appointments.filter((item) =>
                linkedIds.has(item.patientId),
              ).length,
              icon: CalendarDays,
            },
            {
              label: "Statements",
              value: readModel.billingRecords.filter((item) =>
                linkedIds.has(item.patientId),
              ).length,
              icon: ReceiptText,
            },
            {
              label: "Immunization Items",
              value: linkedPatients.flatMap((item) => item.immunizations)
                .length,
              icon: Syringe,
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.label} className="metric-card">
                <div>
                  <span className="metric-card-icon">
                    <Icon size={20} aria-hidden="true" />
                  </span>
                </div>
                <div>
                  <p>{item.label}</p>
                  <h2>{item.value}</h2>
                </div>
              </article>
            );
          })}
        </div>
        <DataTable
          columns={[
            "Child",
            "Birth Date",
            "Guardian Link",
            "Allergies",
            "Immunizations",
          ]}
          rows={linkedPatients.map((patient) => [
            patient.name,
            patient.birthDate,
            patient.guardian,
            patient.allergies.length
              ? patient.allergies.join(", ")
              : "None recorded",
            patient.immunizations.join(", "),
          ])}
        />
        <DataTable
          columns={["Clinical Record", "Child", "Status"]}
          rows={readModel.encounters
            .filter((encounter) => linkedIds.has(encounter.patientId))
            .map((encounter) => [
              encounter.diagnosis,
              linkedPatients.find(
                (patient) => patient.id === encounter.patientId,
              )?.name ?? "Linked child",
              <StatusPill key={encounter.id} value={encounter.status} />,
            ])}
        />
        <DataTable
          columns={["Attachment", "Child", "Type", "Size", "Uploaded", ""]}
          rows={readModel.clinicalAttachments
            .filter((attachment) => linkedIds.has(attachment.patientId))
            .map((attachment) => [
              attachment.originalFilename,
              linkedPatients.find(
                (patient) => patient.id === attachment.patientId,
              )?.name ?? "Linked child",
              attachment.mimeType,
              formatClinicalAttachmentSize(attachment.sizeBytes),
              new Date(attachment.createdAt).toLocaleString("en-PH", {
                timeZone: "Asia/Manila",
              }),
              <Link
                key={attachment.id}
                href={`/api/clinical-attachments/${attachment.id}`}
                className="secondary-btn inline-flex items-center gap-2"
              >
                <Download size={16} aria-hidden="true" />
                Download
              </Link>,
            ])}
        />
        <DataTable
          columns={["Statement", "Child", "Amount", "Status"]}
          rows={readModel.billingRecords
            .filter((bill) => linkedIds.has(bill.patientId))
            .map((bill) => [
              bill.id,
              linkedPatients.find((patient) => patient.id === bill.patientId)
                ?.name ?? "Linked child",
              formatMoney(bill.totalMinor),
              <StatusPill key={bill.id} value={bill.status} />,
            ])}
        />
      </div>
    </main>
  );
}
