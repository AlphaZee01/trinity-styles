import { createClient } from "@supabase/supabase-js";
import { getServiceRoleKey, getSupabaseUrl } from "@/lib/env";

export function createAdminClient() {
  const url = getSupabaseUrl();
  const key = getServiceRoleKey();
  if (!url || !key) {
    throw new Error("Supabase service role is not configured");
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
