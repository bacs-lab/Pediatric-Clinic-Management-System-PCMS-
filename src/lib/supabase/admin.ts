import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getSupabaseServiceConfig } from "@/lib/supabase/config";
import type { Database } from "@/types/database.generated";

export function createAdminClient() {
  const config = getSupabaseServiceConfig();

  if (!config) {
    return null;
  }

  return createSupabaseClient<Database>(config.url, config.serviceRoleKey, {
    auth: {
      persistSession: false,
    },
  });
}
