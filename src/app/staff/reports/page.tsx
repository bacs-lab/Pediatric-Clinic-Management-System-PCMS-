import { Download } from "lucide-react";
import { AppShell } from "@/components/app-shell";

const reports = [
  {
    href: "/api/reports/appointments",
    label: "Daily Appointment CSV",
    detail:
      "Appointment schedule, patient label, provider, status, and reason.",
  },
  {
    href: "/api/reports/billing",
    label: "Daily Billing CSV",
    detail: "Manual billing status and totals with spreadsheet-safe cells.",
  },
  {
    href: "/api/reports/inventory",
    label: "Daily Inventory CSV",
    detail: "Inventory levels, reorder status, and units.",
  },
];

export default function ReportsPage() {
  return (
    <AppShell title="Reports">
      <div className="grid gap-3">
        {reports.map((report) => (
          <article
            key={report.href}
            className="rounded-md border border-clinic-line bg-white p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold">{report.label}</h2>
                <p className="mt-1 text-sm text-slate-600">{report.detail}</p>
              </div>
              <a
                href={report.href}
                className="inline-flex items-center gap-2 rounded-md bg-clinic-teal px-3 py-2 text-sm font-medium text-white"
              >
                <Download size={16} aria-hidden="true" />
                Download
              </a>
            </div>
          </article>
        ))}
      </div>
    </AppShell>
  );
}
