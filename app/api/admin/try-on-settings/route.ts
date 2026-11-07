import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { isServiceRoleConfigured } from "@/lib/env";
import {
  TRY_ON_SETTINGS_ID,
  TRY_ON_URL_PRESETS,
  getTryOnSettingsRow,
  isTryOnAiConfigured,
  maskApiKey,
  resolveRunpodEndpointMode,
  type RunpodEndpointMode,
} from "@/lib/try-on-settings";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireAdminApi() {
  if (!isServiceRoleConfigured()) {
    return NextResponse.json({ error: "Connect Supabase to manage try-on settings." }, { status: 503 });
  }
  const { role } = await getAuthContext();
  if (role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }
  return null;
}

export async function GET() {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const row = await getTryOnSettingsRow();
  const configured = await isTryOnAiConfigured();
  const submitUrl =
    row.runpod_submit_job_url ??
    TRY_ON_URL_PRESETS[row.runpod_endpoint_mode === "seedream_v4_edit" ? "seedream_v4_edit" : "qwen_image_edit"]
      .submitJobUrl;

  return NextResponse.json({
    runpodEndpointMode: row.runpod_endpoint_mode,
    effectivePayloadMode: resolveRunpodEndpointMode(row.runpod_endpoint_mode, submitUrl),
    runpodSubmitJobUrl: row.runpod_submit_job_url,
    runpodCheckStatusUrl: row.runpod_check_status_url,
    runpodEndpointId: row.runpod_endpoint_id,
    runpodTimeoutMs: row.runpod_timeout_ms,
    runpodMaxRetries: row.runpod_max_retries,
    runpodPollIntervalMs: row.runpod_poll_interval_ms,
    tryOnPrompt: row.try_on_prompt,
    tryOnNegativePrompt: row.try_on_negative_prompt,
    useStubWhenUnconfigured: row.use_stub_when_unconfigured,
    apiKey: maskApiKey(row.runpod_api_key),
    runpodBalanceUsd: row.runpod_balance_usd == null ? null : Number(row.runpod_balance_usd),
    configured,
    updatedAt: row.updated_at,
    presets: TRY_ON_URL_PRESETS,
  });
}

export async function PATCH(request: Request) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const body = (await request.json()) as {
    runpodApiKey?: string;
    clearApiKey?: boolean;
    runpodEndpointMode?: RunpodEndpointMode;
    runpodSubmitJobUrl?: string;
    runpodCheckStatusUrl?: string;
    runpodEndpointId?: string;
    runpodTimeoutMs?: number;
    runpodMaxRetries?: number;
    runpodPollIntervalMs?: number;
    tryOnPrompt?: string | null;
    tryOnNegativePrompt?: string | null;
    useStubWhenUnconfigured?: boolean;
    runpodBalanceUsd?: number | null;
    applyPreset?: Exclude<RunpodEndpointMode, "custom">;
  };

  const admin = createAdminClient();
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (body.applyPreset) {
    patch.runpod_endpoint_mode = body.applyPreset;
    patch.runpod_submit_job_url = TRY_ON_URL_PRESETS[body.applyPreset].submitJobUrl;
    patch.runpod_check_status_url = TRY_ON_URL_PRESETS[body.applyPreset].checkStatusUrl;
  }

  if (body.runpodEndpointMode) patch.runpod_endpoint_mode = body.runpodEndpointMode;
  if (body.runpodSubmitJobUrl !== undefined) patch.runpod_submit_job_url = body.runpodSubmitJobUrl.trim() || null;
  if (body.runpodCheckStatusUrl !== undefined) {
    const url = body.runpodCheckStatusUrl.trim();
    if (url && !url.includes("{jobId}")) {
      return NextResponse.json({ error: "Status URL must include {jobId}." }, { status: 400 });
    }
    patch.runpod_check_status_url = url || null;
  }
  if (body.runpodEndpointId !== undefined) patch.runpod_endpoint_id = body.runpodEndpointId.trim() || null;
  if (typeof body.runpodTimeoutMs === "number") patch.runpod_timeout_ms = body.runpodTimeoutMs;
  if (typeof body.runpodMaxRetries === "number") patch.runpod_max_retries = body.runpodMaxRetries;
  if (typeof body.runpodPollIntervalMs === "number") patch.runpod_poll_interval_ms = body.runpodPollIntervalMs;
  if (body.tryOnPrompt !== undefined) patch.try_on_prompt = body.tryOnPrompt?.trim() || null;
  if (body.tryOnNegativePrompt !== undefined) patch.try_on_negative_prompt = body.tryOnNegativePrompt?.trim() || null;
  if (typeof body.useStubWhenUnconfigured === "boolean") {
    patch.use_stub_when_unconfigured = body.useStubWhenUnconfigured;
  }

  if (body.runpodBalanceUsd === null) {
    patch.runpod_balance_usd = null;
  } else if (typeof body.runpodBalanceUsd === "number") {
    if (!Number.isFinite(body.runpodBalanceUsd) || body.runpodBalanceUsd < 0) {
      return NextResponse.json({ error: "Enter a balance of zero or more." }, { status: 400 });
    }
    patch.runpod_balance_usd = Math.round(body.runpodBalanceUsd * 100) / 100;
  }

  if (body.clearApiKey) {
    patch.runpod_api_key = null;
  } else if (body.runpodApiKey?.trim()) {
    patch.runpod_api_key = body.runpodApiKey.trim();
  }

  const { error } = await admin.from("try_on_settings").update(patch).eq("id", TRY_ON_SETTINGS_ID);
  if (error?.code === "42P01") {
    return NextResponse.json({ error: "Run the try_on_settings migration first." }, { status: 503 });
  }
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const next = await getTryOnSettingsRow();
  const submitUrl =
    next.runpod_submit_job_url ??
    TRY_ON_URL_PRESETS[next.runpod_endpoint_mode === "seedream_v4_edit" ? "seedream_v4_edit" : "qwen_image_edit"]
      .submitJobUrl;

  return NextResponse.json({
    ok: true,
    apiKey: maskApiKey(next.runpod_api_key),
    configured: await isTryOnAiConfigured(),
    effectivePayloadMode: resolveRunpodEndpointMode(next.runpod_endpoint_mode, submitUrl),
  });
}
