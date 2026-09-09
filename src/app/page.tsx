import { ClipboardList, FileText, ShieldCheck, UsersRound } from "lucide-react";
import Link from "next/link";

const workstreams = [
  {
    label: "Patients and Guardians",
    status: "Scaffolded",
    icon: UsersRound,
    detail:
      "Guardian-child linking and demographic correction workflow are modeled for Phase 2.",
  },
  {
    label: "Appointments and Queue",
    status: "Planned",
    icon: ClipboardList,
    detail:
      "Database-enforced collision and daily queue-number rules are documented for Phase 3.",
  },
  {
    label: "Clinical Records",
    status: "Planned",
    icon: FileText,
    detail:
      "Draft/final/addendum/void lifecycle is captured in schema and ADR foundations.",
  },
  {
    label: "RLS and Audit",
    status: "Foundation",
    icon: ShieldCheck,
    detail:
      "Every initial exposed table has RLS enabled with deny-by-default posture.",
  },
];

export default function Home() {
  return (
    <main className="pcms-shell">
      <section className="dashboard-hero">
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="eyebrow">PCMS v2.0</p>
              <h1>Pediatric Clinic Management System</h1>
            </div>
            <Link href="/staff" className="primary-btn">
              Open Staff Workspace
            </Link>
            <Link href="/login" className="secondary-btn">
              Login
            </Link>
            <Link href="/guardian" className="secondary-btn">
              Guardian Portal
            </Link>
          </div>
          <p className="max-w-3xl text-base leading-7">
            This branch replaces the legacy MERN runtime with a strict
            TypeScript Next.js App Router foundation backed by Supabase Auth,
            PostgreSQL, RLS, and private Storage design. Production use remains
            blocked pending owner, clinical, privacy, and security approvals.
          </p>
        </div>
      </section>
      <section className="grid gap-4 md:grid-cols-2">
        {workstreams.map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.label} className="panel">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="metric-card-icon">
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <h2 className="text-lg font-semibold">{item.label}</h2>
                </div>
                <span className="status-badge neutral">{item.status}</span>
              </div>
              <p className="mt-4 text-sm leading-6">{item.detail}</p>
            </article>
          );
        })}
      </section>
    </main>
  );
}
