import Link from "next/link";
import { MfaManagement } from "@/components/mfa-management";
import { requireAuthenticatedMfaSetup } from "@/lib/auth/mfa";

export const dynamic = "force-dynamic";

export default async function GuardianSecurityPage() {
  await requireAuthenticatedMfaSetup();

  return (
    <main className="pcms-shell">
      <div className="pcms-topbar">
        <div>
          <p className="eyebrow">Guardian portal</p>
          <h1>Security</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/guardian" className="secondary-btn">
            Guardian Portal
          </Link>
          <Link href="/" className="secondary-btn">
            Home
          </Link>
        </div>
      </div>
      <MfaManagement />
    </main>
  );
}
