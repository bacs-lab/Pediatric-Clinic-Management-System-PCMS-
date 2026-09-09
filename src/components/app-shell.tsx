import {
  Activity,
  CalendarDays,
  ClipboardList,
  FileClock,
  FileText,
  LayoutDashboard,
  Package,
  ReceiptText,
  ShieldCheck,
  ShieldPlus,
  Syringe,
  UsersRound,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { logoutAction } from "@/features/auth/actions";
import { requireMfaEnrollment } from "@/lib/auth/mfa";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

const navItems = [
  { href: "/staff", label: "Dashboard", icon: LayoutDashboard },
  { href: "/staff/patients", label: "Patients", icon: UsersRound },
  { href: "/staff/appointments", label: "Appointments", icon: CalendarDays },
  { href: "/staff/queue", label: "Queue", icon: ClipboardList },
  { href: "/staff/clinical", label: "Clinical", icon: FileText },
  { href: "/staff/vaccinations", label: "Vaccinations", icon: Syringe },
  { href: "/staff/billing", label: "Billing", icon: ReceiptText },
  { href: "/staff/inventory", label: "Inventory", icon: Package },
  { href: "/staff/reports", label: "Reports", icon: FileClock },
  { href: "/staff/audit", label: "Audit", icon: ShieldCheck },
  { href: "/staff/security", label: "Security", icon: ShieldPlus },
  { href: "/staff/admin", label: "Admin", icon: Activity },
];

async function getCurrentUserEmail() {
  if (!getSupabaseConfig()) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.email) {
    return null;
  }

  const { data: aalData, error: aalError } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  if (
    !aalError &&
    aalData?.nextLevel === "aal2" &&
    aalData.currentLevel !== "aal2"
  ) {
    redirect("/login/mfa");
  }

  return String(data.claims.email);
}

export async function AppShell({
  children,
  allowMfaEnrollment = false,
  title,
}: Readonly<{
  allowMfaEnrollment?: boolean;
  children: React.ReactNode;
  title: string;
}>) {
  if (!allowMfaEnrollment) {
    await requireMfaEnrollment("/staff/security");
  }

  const userEmail = await getCurrentUserEmail();

  return (
    <main className="pcms-shell">
      <div className="pcms-layout">
        <nav className="pcms-sidebar" aria-label="Staff navigation">
          <Link
            href="/"
            className="pcms-brand"
            title="Kids First Pediatric Clinic"
          >
            <Image
              src="/pcms-logo.png"
              alt="Kids First Pediatric Clinic"
              width={52}
              height={52}
              priority
            />
            <div>
              <h2>Kids First</h2>
              <span>PCMS</span>
            </div>
          </Link>
          <div className="pcms-nav">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="pcms-nav-link"
                >
                  <Icon size={22} aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
        <section className="pcms-main">
          <div className="pcms-topbar">
            <div>
              <p className="eyebrow">PCMS v2 local demo</p>
              <h1>{title}</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {userEmail ? (
                <>
                  <span className="status-badge success">{userEmail}</span>
                  <form action={logoutAction}>
                    <button type="submit" className="secondary-btn">
                      Logout
                    </button>
                  </form>
                </>
              ) : (
                <Link href="/login" className="secondary-btn">
                  Login
                </Link>
              )}
              <Link href="/" className="secondary-btn">
                Home
              </Link>
            </div>
          </div>
          {children}
        </section>
      </div>
    </main>
  );
}
