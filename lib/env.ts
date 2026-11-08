export function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
}

export function getSupabaseAnonKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    ""
  );
}

export function isSupabaseConfigured() {
  return Boolean(getSupabaseUrl() && getSupabaseAnonKey());
}

export function getServiceRoleKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
}

export function isServiceRoleConfigured() {
  return isSupabaseConfigured() && Boolean(getServiceRoleKey());
}

export function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export function getMoolreApiUser() {
  return process.env.MOOLRE_API_USER ?? "";
}

export function getMoolreApiPubKey() {
  return process.env.MOOLRE_API_PUBKEY ?? "";
}

export function getMoolreAccountNumber() {
  return process.env.MOOLRE_ACCOUNT_NUMBER ?? "";
}

export function getMoolreWebhookSecret() {
  return process.env.MOOLRE_WEBHOOK_SECRET ?? "";
}

export function getRunpodConfig() {
  return {
    apiKey: process.env.RUNPOD_API_KEY ?? "",
    endpointId: process.env.RUNPOD_ENDPOINT_ID ?? "",
    submitJobUrl: process.env.RUNPOD_SUBMIT_JOB_URL ?? "",
    checkStatusUrl: process.env.RUNPOD_CHECK_STATUS_URL ?? "",
  };
}

export function tryOnRateLimit() {
  return {
    windowMs: Number(process.env.TRY_ON_RATE_LIMIT_WINDOW_MS ?? 60_000),
    max: Number(process.env.TRY_ON_RATE_LIMIT_MAX ?? 5),
  };
}
