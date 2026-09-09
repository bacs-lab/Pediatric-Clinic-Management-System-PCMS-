import { createBrowserClient } from "@supabase/ssr";
import { requireSupabaseConfig } from "@/lib/supabase/config";
import type { Database } from "@/types/database.generated";

export function createClient() {
  const config = requireSupabaseConfig();

  return createBrowserClient<Database>(config.url, config.publishableKey);
}
