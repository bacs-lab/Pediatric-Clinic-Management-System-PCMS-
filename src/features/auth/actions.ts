"use server";

import { redirect } from "next/navigation";
import { loginSchema, passwordUpdateSchema } from "@/features/demo/validation";
import { getSupabaseConfig } from "@/lib/supabase/config";
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

  redirect("/staff");
}
