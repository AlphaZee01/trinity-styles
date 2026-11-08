import { isServiceRoleConfigured } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";

export async function enforceTryOnRateLimit(bucketKey: string, max: number, windowMs: number) {
  if (!isServiceRoleConfigured()) {
    return rateLimit(`try-on:${bucketKey}`, max, windowMs);
  }
  const admin = createAdminClient();
  const since = new Date(Date.now() - windowMs).toISOString();
  const { count, error } = await admin
    .from("try_on_rate_events")
    .select("*", { count: "exact", head: true })
    .eq("bucket_key", bucketKey)
    .gte("created_at", since);
  if (error) {
    return rateLimit(`try-on:${bucketKey}`, max, windowMs);
  }
  if ((count ?? 0) >= max) {
    return { ok: false as const, remaining: 0 };
  }
  await admin.from("try_on_rate_events").insert({ bucket_key: bucketKey });
  return { ok: true as const, remaining: Math.max(0, max - (count ?? 0) - 1) };
}
