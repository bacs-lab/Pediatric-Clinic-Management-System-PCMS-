import { AppShell } from "@/components/app-shell";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { DataTable } from "@/components/data-table";
import { StatusPill } from "@/components/status-pill";
import { WorkflowFeedback } from "@/components/workflow-feedback";
import { formatMoney } from "@/features/demo/data";
import {
  correctBillingRecordAction,
  createBillingRecordAction,
  updateBillingStatusAction,
  voidBillingRecordAction,
} from "@/features/pcms/actions";
import {
  formatPatientNameFromReadModel,
  getPcmsReadModel,
} from "@/features/pcms/read-model";

export const dynamic = "force-dynamic";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ workflow?: string }>;
}) {
  const readModel = await getPcmsReadModel();
  const resolvedSearchParams = await searchParams;

  return (
    <AppShell title="Billing">
      <div className="grid gap-5">
        <WorkflowFeedback value={resolvedSearchParams.workflow} />
        <section className="panel">
          <div className="panel-header">
            <h2 className="text-lg font-semibold">Create Billing Record</h2>
          </div>
          <form
            action={createBillingRecordAction}
            className="mt-4 grid gap-3 md:grid-cols-4"
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
              <span>Total cents</span>
              <input
                name="totalMinor"
                type="number"
                min="0"
                step="1"
                required
                className="rounded-md border border-clinic-line px-3 py-2"
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span>Status</span>
              <select
                name="status"
                defaultValue="draft"
                className="rounded-md border border-clinic-line px-3 py-2"
              >
                <option value="draft">Draft</option>
                <option value="issued">Issued</option>
                <option value="paid">Paid</option>
              </select>
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
            "Bill",
            "Patient",
            "Total",
            "Status",
            "History",
            "Change",
            "Correction / Void",
          ]}
          rows={readModel.billingRecords.map((bill) => [
            bill.id,
            formatPatientNameFromReadModel(readModel, bill.patientId),
            formatMoney(bill.totalMinor),
            <StatusPill key={bill.id} value={bill.status} />,
            `${bill.adjustmentCount} adjustment${bill.adjustmentCount === 1 ? "" : "s"}`,
            <form
              key={`${bill.id}-status`}
              action={updateBillingStatusAction}
              className="flex gap-2"
            >
              <input type="hidden" name="billingId" value={bill.id} />
              <select
                name="status"
                defaultValue={bill.status}
                className="rounded-md border border-clinic-line px-2 py-1 text-sm"
              >
                <option value="draft">Draft</option>
                <option value="issued">Issued</option>
                <option value="paid">Paid</option>
              </select>
              <button
                type="submit"
                className="secondary-btn"
                disabled={bill.status === "void"}
              >
                Apply
              </button>
            </form>,
            <div key={`${bill.id}-lifecycle`} className="grid gap-2">
              <form
                action={correctBillingRecordAction}
                className="grid min-w-80 gap-2"
              >
                <input type="hidden" name="billingId" value={bill.id} />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    name="totalMinor"
                    type="number"
                    min="0"
                    step="1"
                    defaultValue={bill.totalMinor}
                    required
                    className="rounded-md border border-clinic-line px-2 py-1 text-sm"
                  />
                  <select
                    name="status"
                    defaultValue={
                      bill.status === "void" ? "issued" : bill.status
                    }
                    className="rounded-md border border-clinic-line px-2 py-1 text-sm"
                  >
                    <option value="draft">Draft</option>
                    <option value="issued">Issued</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
                <input
                  name="reason"
                  placeholder="Correction reason"
                  minLength={5}
                  maxLength={300}
                  required
                  className="rounded-md border border-clinic-line px-2 py-1 text-sm"
                />
                <ConfirmSubmitButton
                  className="secondary-btn"
                  disabled={bill.status === "void"}
                  message="Apply this billing correction? The adjustment will be recorded in billing history."
                >
                  Correct
                </ConfirmSubmitButton>
              </form>
              <form action={voidBillingRecordAction} className="grid gap-2">
                <input type="hidden" name="billingId" value={bill.id} />
                <div className="flex gap-2">
                  <input
                    name="reason"
                    placeholder="Void reason"
                    minLength={5}
                    maxLength={300}
                    required
                    className="min-w-48 rounded-md border border-clinic-line px-2 py-1 text-sm"
                  />
                  <input
                    name="confirmationText"
                    placeholder="Type VOID"
                    pattern="VOID"
                    required
                    className="w-28 rounded-md border border-clinic-line px-2 py-1 text-sm"
                  />
                </div>
                <ConfirmSubmitButton
                  className="secondary-btn"
                  disabled={bill.status === "void"}
                  message="Void this billing record? This action requires adjustment history and cannot be applied as a normal status change."
                >
                  Void
                </ConfirmSubmitButton>
              </form>
            </div>,
          ])}
        />
      </div>
    </AppShell>
  );
}
