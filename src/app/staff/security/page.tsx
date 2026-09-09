import { AppShell } from "@/components/app-shell";
import { MfaManagement } from "@/components/mfa-management";

export const dynamic = "force-dynamic";

export default function SecurityPage() {
  return (
    <AppShell title="Security" allowMfaEnrollment>
      <MfaManagement />
    </AppShell>
  );
}
