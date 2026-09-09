import {
  Activity,
  AlertTriangle,
  CalendarDays,
  FileText,
  Package,
  ReceiptText,
} from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { StatusPill } from "@/components/status-pill";
import { formatMoney } from "@/features/demo/data";
import { getPcmsReadModel } from "@/features/pcms/read-model";

export const dynamic = "force-dynamic";

export default async function StaffPage() {
  const readModel = await getPcmsReadModel();
  const stats = [
    {
      label: "Active Patients",
      value: readModel.patients.length,
      icon: Activity,
    },
    {
      label: "Today Queue",
      value: readModel.queueEntries.length,
      icon: CalendarDays,
    },
    {
      label: "Open Encounters",
      value: readModel.encounters.filter((item) => item.status === "draft")
        .length,
      icon: FileText,
    },
    {
      label: "Low Stock",
      value: readModel.inventoryItems.filter(
        (item) => item.onHand <= item.reorderLevel,
      ).length,
      icon: Package,
    },
  ];

  const isSynthetic = readModel.source === "synthetic";

  return (
    <AppShell title="Staff Workspace">
      <div className="grid gap-5">
        {isSynthetic ? (
          <div className="panel flex gap-3 text-sm">
            <AlertTriangle size={18} aria-hidden="true" />
            <p>
              Supabase is not configured, so this workspace is running with
              synthetic local data only. Protected production workflows remain
              blocked.
            </p>
          </div>
        ) : null}
        <div className="stats-row">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <article key={stat.label} className="metric-card">
                <div className="flex items-center justify-between">
                  <span className="metric-card-icon">
                    <Icon size={20} aria-hidden="true" />
                  </span>
                </div>
                <div>
                  <p>{stat.label}</p>
                  <h2>{stat.value}</h2>
                </div>
              </article>
            );
          })}
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          <section className="panel">
            <div className="panel-header">
              <h2 className="text-lg font-semibold">Clinic Flow</h2>
              <Link href="/staff/queue" className="secondary-btn">
                Open queue
              </Link>
            </div>
            <div className="mt-4 grid gap-3">
              {readModel.queueEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between rounded-2xl border border-[var(--line)] bg-white p-3"
                >
                  <span className="font-medium">#{entry.queueNumber}</span>
                  <StatusPill value={entry.state} />
                </div>
              ))}
            </div>
          </section>
          <section className="panel">
            <div className="panel-header">
              <h2 className="text-lg font-semibold">Billing Snapshot</h2>
              <ReceiptText
                size={18}
                className="text-clinic-teal"
                aria-hidden="true"
              />
            </div>
            <div className="mt-4 grid gap-3">
              {readModel.billingRecords.map((bill) => (
                <div
                  key={bill.id}
                  className="flex items-center justify-between rounded-2xl border border-[var(--line)] bg-white p-3"
                >
                  <span>{bill.id}</span>
                  <span className="font-medium">
                    {formatMoney(bill.totalMinor)}
                  </span>
                  <StatusPill value={bill.status} />
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
