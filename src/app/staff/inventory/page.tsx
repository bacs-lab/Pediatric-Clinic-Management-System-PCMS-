import { AppShell } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { StatusPill } from "@/components/status-pill";
import { WorkflowFeedback } from "@/components/workflow-feedback";
import {
  createInventoryItemAction,
  createInventoryMovementAction,
} from "@/features/pcms/actions";
import { getPcmsReadModel } from "@/features/pcms/read-model";

export const dynamic = "force-dynamic";

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ workflow?: string }>;
}) {
  const readModel = await getPcmsReadModel();
  const resolvedSearchParams = await searchParams;

  return (
    <AppShell title="Inventory">
      <div className="grid gap-5">
        <WorkflowFeedback value={resolvedSearchParams.workflow} />
        <div className="grid gap-5 xl:grid-cols-2">
          <section className="panel">
            <div className="panel-header">
              <h2 className="text-lg font-semibold">Add Inventory Item</h2>
            </div>
            <form
              action={createInventoryItemAction}
              className="mt-4 grid gap-3"
            >
              <label className="grid gap-1 text-sm">
                <span>Name</span>
                <input
                  name="name"
                  required
                  className="rounded-md border border-clinic-line px-3 py-2"
                />
              </label>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="grid gap-1 text-sm">
                  <span>Unit</span>
                  <input
                    name="unit"
                    required
                    className="rounded-md border border-clinic-line px-3 py-2"
                  />
                </label>
                <label className="grid gap-1 text-sm">
                  <span>Reorder level</span>
                  <input
                    name="reorderLevel"
                    type="number"
                    min="0"
                    step="0.001"
                    required
                    className="rounded-md border border-clinic-line px-3 py-2"
                  />
                </label>
              </div>
              <button type="submit" className="primary-btn">
                Save
              </button>
            </form>
          </section>
          <section className="panel">
            <div className="panel-header">
              <h2 className="text-lg font-semibold">Record Stock Movement</h2>
            </div>
            <form
              action={createInventoryMovementAction}
              className="mt-4 grid gap-3"
            >
              <label className="grid gap-1 text-sm">
                <span>Item</span>
                <select
                  name="itemId"
                  required
                  className="rounded-md border border-clinic-line px-3 py-2"
                >
                  {readModel.inventoryItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="grid gap-1 text-sm">
                  <span>Quantity change</span>
                  <input
                    name="quantityDelta"
                    type="number"
                    step="0.001"
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
              </div>
              <button type="submit" className="primary-btn">
                Record
              </button>
            </form>
          </section>
        </div>
        <DataTable
          columns={["Item", "Unit", "On Hand", "Reorder Level", "Stock Status"]}
          rows={readModel.inventoryItems.map((item) => [
            item.name,
            item.unit,
            item.onHand,
            item.reorderLevel,
            <StatusPill
              key={item.id}
              value={item.onHand <= item.reorderLevel ? "low_stock" : "active"}
            />,
          ])}
        />
      </div>
    </AppShell>
  );
}
