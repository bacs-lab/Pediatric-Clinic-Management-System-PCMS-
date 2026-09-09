import { redirect } from "next/navigation";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

type RequiredUser = {
  id: string;
  email: string;
  aal: string | null;
};

export async function requireUser(): Promise<RequiredUser> {
  if (!getSupabaseConfig()) {
    redirect("/?supabase=missing");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) {
    redirect("/?auth=required");
  }

  return {
    id: data.claims.sub,
    email: String(data.claims.email ?? "unknown-user"),
    aal: typeof data.claims.aal === "string" ? data.claims.aal : null,
  };
}

export async function requireAal2User(): Promise<RequiredUser> {
  const user = await requireUser();

  if (user.aal !== "aal2") {
    redirect("/?mfa=required");
  }

  return user;
}
