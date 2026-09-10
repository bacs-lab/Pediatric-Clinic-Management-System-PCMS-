"use server";

import { redirect } from "next/navigation";
import {
  loginSchema,
  passwordRecoverySchema,
  passwordUpdateSchema,
} from "@/features/demo/validation";
import { getPcmsAppUrl, getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

function valueOf(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function redirectWithAuthStatus(status: string): never {
  redirect(`/login?auth=${status}`);
}

export async function loginAction(formData: FormData) {
  if (!getSupabaseConfig()) {
    redirectWithAuthStatus("supabase-required");
  }

  const parsed = loginSchema.safeParse({
    email: valueOf(formData, "email"),
    password: valueOf(formData, "password"),
  });

  if (!parsed.success) {
    redirectWithAuthStatus("invalid");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    redirectWithAuthStatus("failed");
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

  redirect("/staff");
}

export async function logoutAction() {
  if (getSupabaseConfig()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  redirect("/login?auth=signed-out");
}

export async function requestPasswordResetAction(formData: FormData) {
  if (!getSupabaseConfig()) {
    redirectWithAuthStatus("supabase-required");
  }

  const parsed = passwordRecoverySchema.safeParse({
    email: valueOf(formData, "email"),
  });

  if (!parsed.success) {
    redirect("/login/recover?auth=invalid");
  }

  const appUrl = getPcmsAppUrl();

  if (!appUrl) {
    redirect("/login/recover?auth=unavailable");
  }

  const supabase = await createClient();
  const redirectTo = new URL("/auth/callback", appUrl).toString();
  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    { redirectTo },
  );

  if (error) {
    redirect("/login/recover?auth=failed");
  }

  redirect("/login?auth=recovery-sent");
}

export async function updatePasswordAction(formData: FormData) {
  if (!getSupabaseConfig()) {
    redirectWithAuthStatus("supabase-required");
  }

  const parsed = passwordUpdateSchema.safeParse({
    password: valueOf(formData, "password"),
    confirmPassword: valueOf(formData, "confirmPassword"),
  });

  if (!parsed.success) {
    redirect("/login/update-password?auth=invalid");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    redirect("/login/update-password?auth=failed");
  }

  await supabase.auth.signOut({ scope: "local" });
  redirect("/login?auth=recovered");
}
