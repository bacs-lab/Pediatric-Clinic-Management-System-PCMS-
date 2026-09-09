import { Download, Upload } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { DataTable } from "@/components/data-table";
import { StatusPill } from "@/components/status-pill";
import { WorkflowFeedback } from "@/components/workflow-feedback";
import {
  createAssessmentAction,
  createClinicalAddendumAction,
  createEncounterDraftAction,
  finalizeEncounterAction,
  updateAssessmentHandoffAction,
  uploadClinicalAttachmentAction,
} from "@/features/pcms/actions";
import {
  formatPatientNameFromReadModel,
  getPcmsReadModel,
} from "@/features/pcms/read-model";
import { formatClinicalAttachmentSize } from "@/lib/clinical-attachments";

export const dynamic = "force-dynamic";

export default async function ClinicalPage({
  searchParams,
}: {
  searchParams: Promise<{ workflow?: string }>;
}) {
  const readModel = await getPcmsReadModel();
  const resolvedSearchParams = await searchParams;
  const draftEncounters = readModel.encounters.filter(
    (encounter) => encounter.status === "draft",
  );
  const finalEncounters = readModel.encounters.filter(
    (encounter) => encounter.status === "final",
  );
  const activeQueueEntries = readModel.queueEntries.filter((entry) =>
    ["waiting", "assessing", "consulting"].includes(entry.state),
  );

  return (
    <AppShell title="Clinical Records">
      <div className="grid gap-5">
        <WorkflowFeedback value={resolvedSearchParams.workflow} />
        <div className="grid gap-5 xl:grid-cols-2">
          <section className="panel">
            <div className="panel-header">
              <h2 className="text-lg font-semibold">Assessment / Vitals</h2>
            </div>
            <form action={createAssessmentAction} className="mt-4 grid gap-3">
              <div className="grid gap-3 md:grid-cols-2">
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
                  <span>Queue link</span>
                  <select
                    name="queueEntryId"
                    className="rounded-md border border-clinic-line px-3 py-2"
                  >
                    <option value="">No queue link</option>
                    {activeQueueEntries.map((entry) => (
                      <option key={entry.id} value={entry.id}>
                        #{entry.queueNumber} -{" "}
                        {formatPatientNameFromReadModel(
                          readModel,
                          entry.patientId,
                        )}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <label className="grid gap-1 text-sm">
                  <span>Temp C</span>
                  <input
                    name="temperatureC"
                    type="number"
                    step="0.1"
                    min="30"
                    max="45"
                    className="rounded-md border border-clinic-line px-3 py-2"
                  />
                </label>
                <label className="grid gap-1 text-sm">
                  <span>Weight kg</span>
                  <input
                    name="weightKg"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="300"
                    className="rounded-md border border-clinic-line px-3 py-2"
                  />
                </label>
                <label className="grid gap-1 text-sm">
                  <span>Height cm</span>
                  <input
                    name="heightCm"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="250"
                    className="rounded-md border border-clinic-line px-3 py-2"
                  />
                </label>
                <label className="grid gap-1 text-sm">
                  <span>Heart bpm</span>
                  <input
                    name="heartRateBpm"
                    type="number"
                    min="20"
                    max="250"
                    className="rounded-md border border-clinic-line px-3 py-2"
                  />
                </label>
                <label className="grid gap-1 text-sm">
                  <span>Resp bpm</span>
                  <input
                    name="respiratoryRateBpm"
                    type="number"
                    min="5"
                    max="80"
                    className="rounded-md border border-clinic-line px-3 py-2"
                  />
                </label>
                <label className="grid gap-1 text-sm">
                  <span>SpO2 %</span>
                  <input
                    name="oxygenSaturationPct"
                    type="number"
                    min="50"
                    max="100"
                    className="rounded-md border border-clinic-line px-3 py-2"
                  />
                </label>
                <label className="grid gap-1 text-sm">
                  <span>BP systolic</span>
                  <input
                    name="bloodPressureSystolic"
                    type="number"
                    min="40"
                    max="250"
                    className="rounded-md border border-clinic-line px-3 py-2"
                  />
                </label>
                <label className="grid gap-1 text-sm">
                  <span>BP diastolic</span>
                  <input
                    name="bloodPressureDiastolic"
                    type="number"
                    min="20"
                    max="150"
                    className="rounded-md border border-clinic-line px-3 py-2"
                  />
                </label>
                <label className="grid gap-1 text-sm">
                  <span>Handoff</span>
                  <select
                    name="handoffStatus"
                    className="rounded-md border border-clinic-line px-3 py-2"
                    defaultValue="ready_for_consult"
                  >
                    <option value="draft">Draft</option>
                    <option value="ready_for_consult">Ready</option>
                    <option value="in_consult">In consult</option>
                  </select>
                </label>
              </div>
              <label className="grid gap-1 text-sm">
                <span>Chief complaint</span>
                <textarea
                  name="chiefComplaint"
                  required
                  rows={3}
                  className="rounded-md border border-clinic-line px-3 py-2"
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span>Assessment notes</span>
                <textarea
                  name="notes"
                  rows={3}
                  className="rounded-md border border-clinic-line px-3 py-2"
                />
              </label>
              <button type="submit" className="primary-btn">
                Save Assessment
              </button>
            </form>
          </section>
          <section className="panel">
            <div className="panel-header">
              <h2 className="text-lg font-semibold">Draft Encounter</h2>
            </div>
            <form
              action={createEncounterDraftAction}
              className="mt-4 grid gap-3"
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
                <span>Draft note</span>
                <textarea
                  name="notes"
                  required
                  rows={5}
                  className="rounded-md border border-clinic-line px-3 py-2"
                />
              </label>
              <button type="submit" className="primary-btn">
                Save Draft
              </button>
            </form>
          </section>
        </div>
        <DataTable
          columns={[
            "Patient",
            "Assessed By",
            "Vitals",
            "Chief Complaint",
            "Handoff",
            "Captured",
          ]}
          rows={readModel.assessments.map((assessment) => [
            formatPatientNameFromReadModel(readModel, assessment.patientId),
            assessment.assessedBy,
            [
              assessment.temperatureC
                ? `${assessment.temperatureC.toFixed(1)} C`
                : null,
              assessment.weightKg
                ? `${assessment.weightKg.toFixed(2)} kg`
                : null,
              assessment.heightCm
                ? `${assessment.heightCm.toFixed(2)} cm`
                : null,
              assessment.heartRateBpm ? `HR ${assessment.heartRateBpm}` : null,
              assessment.respiratoryRateBpm
                ? `RR ${assessment.respiratoryRateBpm}`
                : null,
              assessment.oxygenSaturationPct
                ? `SpO2 ${assessment.oxygenSaturationPct}%`
                : null,
              assessment.bloodPressure
                ? `BP ${assessment.bloodPressure}`
                : null,
            ]
              .filter(Boolean)
              .join(" / ") || "No vitals recorded",
            assessment.chiefComplaint,
            <form
              key={assessment.id}
              action={updateAssessmentHandoffAction}
              className="flex flex-wrap gap-2"
            >
              <input type="hidden" name="assessmentId" value={assessment.id} />
              <select
                name="handoffStatus"
                defaultValue={assessment.handoffStatus}
                className="rounded-md border border-clinic-line px-2 py-1 text-sm"
              >
                <option value="ready_for_consult">Ready</option>
                <option value="in_consult">In consult</option>
                <option value="completed">Completed</option>
              </select>
              <button type="submit" className="secondary-btn">
                Update
              </button>
            </form>,
            new Date(assessment.createdAt).toLocaleString("en-PH", {
              timeZone: "Asia/Manila",
            }),
          ])}
        />
        <div className="grid gap-5 xl:grid-cols-3">
          <section className="panel">
            <div className="panel-header">
              <h2 className="text-lg font-semibold">Finalize Encounter</h2>
            </div>
            <form action={finalizeEncounterAction} className="mt-4 grid gap-3">
              <label className="grid gap-1 text-sm">
                <span>Draft</span>
                <select
                  name="encounterId"
                  required
                  className="rounded-md border border-clinic-line px-3 py-2"
                >
                  {draftEncounters.map((encounter) => (
                    <option key={encounter.id} value={encounter.id}>
                      {formatPatientNameFromReadModel(
                        readModel,
                        encounter.patientId,
                      )}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-sm">
                <span>Diagnosis</span>
                <textarea
                  name="diagnosis"
                  required
                  rows={4}
                  className="rounded-md border border-clinic-line px-3 py-2"
                />
              </label>
              <label className="flex gap-2 text-sm">
                <input
                  type="checkbox"
                  name="clinicianAttestation"
                  value="I understand this final record cannot be overwritten."
                  required
                  className="mt-1"
                />
                <span>
                  I understand this final record cannot be overwritten.
                </span>
              </label>
              <ConfirmSubmitButton
                className="primary-btn"
                message="Finalize this clinical encounter? Final records cannot be overwritten."
              >
                Finalize
              </ConfirmSubmitButton>
            </form>
          </section>
          <section className="panel">
            <div className="panel-header">
              <h2 className="text-lg font-semibold">Add Addendum</h2>
            </div>
            <form
              action={createClinicalAddendumAction}
              className="mt-4 grid gap-3"
            >
              <label className="grid gap-1 text-sm">
                <span>Final encounter</span>
                <select
                  name="encounterId"
                  required
                  className="rounded-md border border-clinic-line px-3 py-2"
                >
                  {finalEncounters.map((encounter) => (
                    <option key={encounter.id} value={encounter.id}>
                      {formatPatientNameFromReadModel(
                        readModel,
                        encounter.patientId,
                      )}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-sm">
                <span>Reason</span>
                <input
                  name="reason"
                  required
                  className="rounded-md border border-clinic-line px-3 py-2"
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span>Addendum</span>
                <textarea
                  name="body"
                  required
                  rows={3}
                  className="rounded-md border border-clinic-line px-3 py-2"
                />
              </label>
              <button type="submit" className="primary-btn">
                Add
              </button>
            </form>
          </section>
        </div>
        <div className="grid gap-5 xl:grid-cols-[minmax(20rem,0.75fr)_minmax(0,1.25fr)]">
          <section className="panel">
            <div className="panel-header">
              <h2 className="text-lg font-semibold">Clinical Attachment</h2>
            </div>
            <form
              action={uploadClinicalAttachmentAction}
              className="mt-4 grid gap-3"
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
                <span>PDF or image</span>
                <input
                  name="attachment"
                  type="file"
                  accept="application/pdf,image/jpeg,image/png"
                  required
                  className="rounded-md border border-clinic-line bg-white px-3 py-2"
                />
              </label>
              <button
                type="submit"
                className="primary-btn inline-flex items-center justify-center gap-2"
              >
                <Upload size={16} aria-hidden="true" />
                Upload
              </button>
            </form>
          </section>
          <DataTable
            columns={["Patient", "File", "Type", "Size", "Uploaded", ""]}
            rows={readModel.clinicalAttachments.map((attachment) => [
              formatPatientNameFromReadModel(readModel, attachment.patientId),
              attachment.originalFilename,
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
        </div>
        <DataTable
          columns={[
            "Patient",
            "Clinician",
            "Diagnosis / Note",
            "Updated",
            "Addenda",
            "Lifecycle",
          ]}
          rows={readModel.encounters.map((encounter) => [
            formatPatientNameFromReadModel(readModel, encounter.patientId),
            encounter.clinician,
            encounter.diagnosis,
            new Date(encounter.updatedAt).toLocaleString("en-PH", {
              timeZone: "Asia/Manila",
            }),
            encounter.addendaCount,
            <StatusPill key={encounter.id} value={encounter.status} />,
          ])}
        />
      </div>
    </AppShell>
  );
}
