import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { isServiceRoleConfigured } from "@/lib/env";
import { testRunPodConnection } from "@/lib/runpod";
import {
  getResolvedTryOnSettings,
  isAllowedRunpodUrl,
  resolveRunpodEndpointMode,
  type RunpodEndpointMode,
} from "@/lib/try-on-settings";

export async function POST(request: Request) {
  if (!isServiceRoleConfigured()) {
    return NextResponse.json({ error: "Connect Supabase to test try-on settings." }, { status: 503 });
  }
  const { role } = await getAuthContext();
  if (role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    runpodApiKey?: string;
    runpodSubmitJobUrl?: string;
    runpodEndpointMode?: RunpodEndpointMode;
  };

  const resolved = await getResolvedTryOnSettings();
  const apiKey = body.runpodApiKey?.trim() || resolved.apiKey;
  const submitJobUrl = body.runpodSubmitJobUrl?.trim() || resolved.submitJobUrl;
  const endpointMode = body.runpodEndpointMode ?? resolved.endpointMode;

  if (!isAllowedRunpodUrl(submitJobUrl)) {
    return NextResponse.json({ error: "Submit job URL must be a Runpod HTTPS endpoint." }, { status: 400 });
  }

  try {
    const result = await testRunPodConnection({ apiKey, submitJobUrl, endpointMode });
    return NextResponse.json({
      ok: true,
      message: result.message,
      effectivePayloadMode: resolveRunpodEndpointMode(endpointMode, submitJobUrl),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Connection failed" },
      { status: 400 },
    );
  }
}
