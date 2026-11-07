import "server-only";

import { getRunpodConfig } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

export const TRY_ON_SETTINGS_ID = "00000000-0000-4000-8000-000000000001";

export type RunpodEndpointMode = "qwen_image_edit" | "seedream_v4_edit" | "custom";

export type TryOnSettingsRow = {
  id: string;
  runpod_api_key: string | null;
  runpod_endpoint_mode: RunpodEndpointMode;
  runpod_submit_job_url: string | null;
  runpod_check_status_url: string | null;
  runpod_endpoint_id: string | null;
  runpod_timeout_ms: number;
  runpod_max_retries: number;
  runpod_poll_interval_ms: number;
  try_on_prompt: string | null;
  try_on_negative_prompt: string | null;
  use_stub_when_unconfigured: boolean;
  runpod_balance_usd: number | null;
  updated_at: string;
};

export type ResolvedTryOnSettings = {
  apiKey: string;
  /** Mode stored in settings, before a custom URL is inferred. */
  configuredMode: RunpodEndpointMode;
  endpointMode: RunpodEndpointMode;
  submitJobUrl: string;
  checkStatusUrlTemplate: string;
  endpointId: string | null;
  timeoutMs: number;
  maxRetries: number;
  pollIntervalMs: number;
  promptOverride: string | null;
  negativePromptOverride: string | null;
  useStubWhenUnconfigured: boolean;
  balanceUsd: number | null;
};

/** Published RunPod public-endpoint prices, USD per image (pricing page, 28 Oct 2026). */
export const TRY_ON_LIST_PRICE_USD: Record<Exclude<RunpodEndpointMode, "custom">, number> = {
  qwen_image_edit: 0.02,
  seedream_v4_edit: 0.027,
};

export const TRY_ON_WORKER_LABEL: Record<Exclude<RunpodEndpointMode, "custom">, string> = {
  qwen_image_edit: "Qwen Image Edit",
  seedream_v4_edit: "Seedream 4.0 Edit",
};

export type PricedTryOnWorker = Exclude<RunpodEndpointMode, "custom">;

/** List price for a worker. A custom URL is priced only when it names qwen-image-edit or seedream-v4-edit. */
export function listedTryOnRate(
  configuredMode: RunpodEndpointMode,
  submitJobUrl: string,
): { mode: PricedTryOnWorker; priceUsd: number; label: string } | null {
  const lower = submitJobUrl.toLowerCase();
  const mode: PricedTryOnWorker | null =
    configuredMode === "qwen_image_edit"
      ? "qwen_image_edit"
      : configuredMode === "seedream_v4_edit"
        ? "seedream_v4_edit"
        : lower.includes("qwen-image-edit")
          ? "qwen_image_edit"
          : lower.includes("seedream-v4-edit")
            ? "seedream_v4_edit"
            : null;
  if (!mode) return null;
  return { mode, priceUsd: TRY_ON_LIST_PRICE_USD[mode], label: TRY_ON_WORKER_LABEL[mode] };
}

export const TRY_ON_URL_PRESETS: Record<
  Exclude<RunpodEndpointMode, "custom">,
  { submitJobUrl: string; checkStatusUrl: string }
> = {
  qwen_image_edit: {
    submitJobUrl: "https://api.runpod.ai/v2/qwen-image-edit/run",
    checkStatusUrl: "https://api.runpod.ai/v2/qwen-image-edit/status/{jobId}",
  },
  seedream_v4_edit: {
    submitJobUrl: "https://api.runpod.ai/v2/seedream-v4-edit/run",
    checkStatusUrl: "https://api.runpod.ai/v2/seedream-v4-edit/status/{jobId}",
  },
};

const DEFAULTS: Omit<TryOnSettingsRow, "id" | "updated_at"> = {
  runpod_api_key: null,
  runpod_endpoint_mode: "qwen_image_edit",
  runpod_submit_job_url: TRY_ON_URL_PRESETS.qwen_image_edit.submitJobUrl,
  runpod_check_status_url: TRY_ON_URL_PRESETS.qwen_image_edit.checkStatusUrl,
  runpod_endpoint_id: null,
  runpod_timeout_ms: 30000,
  runpod_max_retries: 3,
  runpod_poll_interval_ms: 2000,
  try_on_prompt: null,
  try_on_negative_prompt: null,
  use_stub_when_unconfigured: true,
  runpod_balance_usd: null,
};

function trimOrNull(value: string | null | undefined) {
  if (!value) return null;
  const trimmed = String(value).trim();
  return trimmed || null;
}

export function resolveRunpodEndpointMode(
  mode: RunpodEndpointMode,
  submitJobUrl: string,
): RunpodEndpointMode {
  if (mode !== "custom") return mode;
  const lower = submitJobUrl.toLowerCase();
  if (lower.includes("qwen-image-edit")) return "qwen_image_edit";
  if (lower.includes("seedream-v4-edit")) return "seedream_v4_edit";
  return "seedream_v4_edit";
}

export function maskApiKey(apiKey: string | null | undefined) {
  if (!apiKey?.trim()) return { configured: false as const, last4: null as string | null };
  const trimmed = apiKey.trim();
  return { configured: true as const, last4: trimmed.slice(-4) };
}

function buildUrls(row: TryOnSettingsRow, env: ReturnType<typeof getRunpodConfig>) {
  let submitJobUrl =
    trimOrNull(row.runpod_submit_job_url) || trimOrNull(env.submitJobUrl);
  let checkStatusUrl =
    trimOrNull(row.runpod_check_status_url) || trimOrNull(env.checkStatusUrl);
  const endpointId = trimOrNull(row.runpod_endpoint_id) || trimOrNull(env.endpointId);

  if (!submitJobUrl && endpointId) {
    submitJobUrl = `https://api.runpod.ai/v2/${endpointId}/run`;
  }
  if (!checkStatusUrl && endpointId) {
    checkStatusUrl = `https://api.runpod.ai/v2/${endpointId}/status/{jobId}`;
  }

  if (!submitJobUrl) {
    const preset = TRY_ON_URL_PRESETS[row.runpod_endpoint_mode === "seedream_v4_edit" ? "seedream_v4_edit" : "qwen_image_edit"];
    submitJobUrl = preset.submitJobUrl;
  }
  if (!checkStatusUrl) {
    const preset = TRY_ON_URL_PRESETS[row.runpod_endpoint_mode === "seedream_v4_edit" ? "seedream_v4_edit" : "qwen_image_edit"];
    checkStatusUrl = preset.checkStatusUrl;
  }

  return { submitJobUrl, checkStatusUrl, endpointId };
}

export async function getTryOnSettingsRow(): Promise<TryOnSettingsRow> {
  try {
    const admin = createAdminClient();
    const { data } = await admin.from("try_on_settings").select("*").eq("id", TRY_ON_SETTINGS_ID).maybeSingle();
    if (data) return data as TryOnSettingsRow;
  } catch {
    // Table may not exist locally yet.
  }
  return { id: TRY_ON_SETTINGS_ID, updated_at: new Date().toISOString(), ...DEFAULTS };
}

export async function getResolvedTryOnSettings(): Promise<ResolvedTryOnSettings> {
  const row = await getTryOnSettingsRow();
  const env = getRunpodConfig();
  const apiKey = trimOrNull(row.runpod_api_key) || trimOrNull(env.apiKey) || "";
  const { submitJobUrl, checkStatusUrl, endpointId } = buildUrls(row, env);
  const endpointMode = resolveRunpodEndpointMode(row.runpod_endpoint_mode, submitJobUrl);

  return {
    apiKey,
    configuredMode: row.runpod_endpoint_mode,
    endpointMode,
    submitJobUrl,
    checkStatusUrlTemplate: checkStatusUrl,
    endpointId,
    timeoutMs: row.runpod_timeout_ms ?? DEFAULTS.runpod_timeout_ms,
    maxRetries: row.runpod_max_retries ?? DEFAULTS.runpod_max_retries,
    pollIntervalMs: row.runpod_poll_interval_ms ?? DEFAULTS.runpod_poll_interval_ms,
    promptOverride: trimOrNull(row.try_on_prompt),
    negativePromptOverride: trimOrNull(row.try_on_negative_prompt),
    useStubWhenUnconfigured: row.use_stub_when_unconfigured ?? true,
    balanceUsd: row.runpod_balance_usd == null ? null : Number(row.runpod_balance_usd),
  };
}

export async function isTryOnAiConfigured() {
  const settings = await getResolvedTryOnSettings();
  return Boolean(settings.apiKey && settings.submitJobUrl);
}

export function maxPollAttemptsFromSettings(pollIntervalMs: number) {
  const interval = Math.max(500, pollIntervalMs);
  return Math.ceil(90_000 / interval);
}

export const RUNPOD_HOST_ALLOWLIST = ["api.runpod.ai", "api.runpod.io", "runpod.ai", "runpod.io"];

export function isAllowedRunpodUrl(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    return RUNPOD_HOST_ALLOWLIST.some((host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`));
  } catch {
    return false;
  }
}
