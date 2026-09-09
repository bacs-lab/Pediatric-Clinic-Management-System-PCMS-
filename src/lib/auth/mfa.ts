import { redirect } from "next/navigation";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

type MfaRequirement = {
  requiresEnrollment: boolean;
};

async function getMfaRequirement(): Promise<MfaRequirement> {
  if (!getSupabaseConfig()) {
    return { requiresEnrollment: false };
  }

  const supabase = await createClient();
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims?.sub) {
    redirect("/login?auth=required");
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

  const factors = await supabase.auth.mfa.listFactors();

  if (factors.error) {
    redirect("/login?auth=required");
  }

  return {
    requiresEnrollment: !factors.data.totp.some(
      (factor) => factor.status === "verified",
    ),
  };
}

export async function requireMfaEnrollment(path: string) {
  const requirement = await getMfaRequirement();

  if (requirement.requiresEnrollment) {
    redirect(path);
  }
}

export async function requireAuthenticatedMfaSetup() {
  await getMfaRequirement();
}
