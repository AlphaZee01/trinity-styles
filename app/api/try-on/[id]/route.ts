import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { isServiceRoleConfigured } from "@/lib/env";
import { persistTryOnResultImage } from "@/lib/try-on-result";
import { getResolvedTryOnSettings, isTryOnAiConfigured } from "@/lib/try-on-settings";
import { extractResultUrl, extractRunpodCostUsd, formatTryOnJobError, getTryOnJob } from "@/lib/runpod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getMemorySession } from "@/lib/try-on-memory";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { userId, role } = await getAuthContext().catch(() => ({ userId: null, role: null }));
  const memory = getMemorySession(id);
  if (memory) {
    if (!userId) {
      return NextResponse.json({ error: "Sign in to try this on." }, { status: 401 });
    }
    if (memory.userId !== userId && role !== "admin") {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    return NextResponse.json({
      id: memory.id,
      status: memory.status,
      resultImageUrl: memory.resultImageUrl,
    });
  }

  if (!isServiceRoleConfigured()) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const admin = createAdminClient();
  const { data: session } = await admin.from("try_on_sessions").select("*").eq("id", id).maybeSingle();
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (!userId) {
    return NextResponse.json({ error: "Sign in to try this on." }, { status: 401 });
  }
  if (session.user_id !== userId && role !== "admin") {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const settings = await getResolvedTryOnSettings();
  const aiReady = await isTryOnAiConfigured();
  let failureMessage: string | null = null;

  if (
    session.status === "processing" &&
    session.runpod_job_id &&
    aiReady &&
    !session.runpod_job_id.startsWith("stub-")
  ) {
    try {
      const job = await getTryOnJob(session.runpod_job_id, settings);
      if (job.status === "COMPLETED") {
        const remoteUrl = extractResultUrl(job, session.person_image_url ?? "");
        let storedUrl = remoteUrl;
        if (remoteUrl.startsWith("http")) {
          try {
            storedUrl = await persistTryOnResultImage({
              sessionId: id,
              userId: session.user_id,
              sourceUrl: remoteUrl,
            });
          } catch {
            storedUrl = remoteUrl;
          }
        }
        await admin
          .from("try_on_sessions")
          .update({
            status: "completed",
            result_image_url: storedUrl,
            runpod_cost_usd: extractRunpodCostUsd(job),
          })
          .eq("id", id);
        session.status = "completed";
        session.result_image_url = storedUrl;
      } else if (job.status === "FAILED" || job.status === "CANCELLED") {
        failureMessage = formatTryOnJobError(job.error);
        await admin.from("try_on_sessions").update({ status: "failed" }).eq("id", id);
        session.status = "failed";
      }
    } catch {
      // Keep processing; the client will poll again.
    }
  } else if (session.status === "processing" && session.runpod_job_id?.startsWith("stub-") && session.result_image_url) {
    await admin.from("try_on_sessions").update({ status: "completed" }).eq("id", id);
    session.status = "completed";
  }

  return NextResponse.json({
    id: session.id,
    status: session.status,
    resultImageUrl: session.result_image_url,
    ...(failureMessage ? { error: failureMessage } : {}),
  });
}
