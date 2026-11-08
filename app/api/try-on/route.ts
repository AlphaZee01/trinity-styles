import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { isServiceRoleConfigured } from "@/lib/env";
import { getProductById } from "@/lib/products";
import { clientIp } from "@/lib/rate-limit";
import { enforceTryOnRateLimit } from "@/lib/try-on-rate-db";
import { tryOnRateLimit } from "@/lib/env";
import { buildTryOnProductContext } from "@/lib/try-on-product-context";
import {
  getResolvedTryOnSettings,
  isTryOnAiConfigured,
  listedTryOnRate,
  maxPollAttemptsFromSettings,
} from "@/lib/try-on-settings";
import { startTryOnJob } from "@/lib/runpod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createMemorySession } from "@/lib/try-on-memory";

export async function POST(request: Request) {
  const limits = tryOnRateLimit();
  const { userId } = await getAuthContext().catch(() => ({ userId: null }));
  const bucket = userId ? `user:${userId}` : `ip:${clientIp(request)}`;
  const limited = await enforceTryOnRateLimit(bucket, limits.max, limits.windowMs);
  if (!limited.ok) {
    return NextResponse.json({ error: "Too many try-on requests. Wait a moment." }, { status: 429 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  let productId = "";
  let personImagePath = "";
  let requestedGarment = "";
  let uploadedBytes: ArrayBuffer | null = null;
  let uploadedType = "image/jpeg";

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    productId = String(form.get("productId") ?? "");
    requestedGarment = String(form.get("garmentImageUrl") ?? "");
    const file = form.get("personImage");
    if (file instanceof File) {
      uploadedBytes = await file.arrayBuffer();
      uploadedType = file.type || "image/jpeg";
    }
    personImagePath = String(form.get("personImagePath") ?? "");
  } else {
    const json = (await request.json()) as {
      productId?: string;
      personImagePath?: string;
      garmentImageUrl?: string;
    };
    productId = json.productId ?? "";
    personImagePath = json.personImagePath ?? "";
    requestedGarment = json.garmentImageUrl ?? "";
  }

  const product = await getProductById(productId);
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }
  const garmentImageUrl = requestedGarment
    ? product.images.find((image) => image === requestedGarment)
    : product.images[0];
  if (!garmentImageUrl) {
    return NextResponse.json(
      { error: requestedGarment ? "Choose one of this product's photos." : "This product has no garment image yet." },
      { status: 400 },
    );
  }

  const settings = await getResolvedTryOnSettings();
  const pollIntervalMs = settings.pollIntervalMs;
  const maxPollAttempts = maxPollAttemptsFromSettings(pollIntervalMs);

  if (!isServiceRoleConfigured()) {
    const personUrl =
      personImagePath ||
      (uploadedBytes ? `data:${uploadedType};base64,${Buffer.from(uploadedBytes).toString("base64")}` : "");
    if (!personUrl) {
      return NextResponse.json({ error: "A person photo is required." }, { status: 400 });
    }
    const session = createMemorySession({
      productId,
      userId,
      personImageUrl: personUrl,
      garmentImageUrl,
    });
    return NextResponse.json({
      sessionId: session.id,
      status: session.status,
      pollIntervalMs,
      maxPollAttempts,
    });
  }

  const admin = createAdminClient();
  const folder = userId ?? "guest";
  let personImageUrl = personImagePath;

  if (uploadedBytes) {
    const path = `${folder}/${crypto.randomUUID()}.jpg`;
    const { error } = await admin.storage.from("user-photos").upload(path, uploadedBytes, {
      contentType: uploadedType,
      upsert: false,
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    const signed = await admin.storage.from("user-photos").createSignedUrl(path, 60 * 60);
    personImageUrl = signed.data?.signedUrl ?? path;
  }

  if (!personImageUrl) {
    return NextResponse.json({ error: "A person photo is required." }, { status: 400 });
  }

  const insertPayload: Record<string, unknown> = {
    user_id: userId,
    product_id: productId,
    person_image_url: personImageUrl,
    status: "processing",
    selected_garment_image_url: garmentImageUrl,
  };

  const { data: row, error } = await admin
    .from("try_on_sessions")
    .insert(insertPayload)
    .select("id")
    .single();

  if (error?.code === "42703" || error?.message?.includes("selected_garment_image_url")) {
    const { data: fallbackRow, error: fallbackError } = await admin
      .from("try_on_sessions")
      .insert({
        user_id: userId,
        product_id: productId,
        person_image_url: personImageUrl,
        status: "processing",
      })
      .select("id")
      .single();
    if (fallbackError || !fallbackRow) {
      return NextResponse.json({ error: fallbackError?.message ?? "Could not create session" }, { status: 400 });
    }
    return continueSession(fallbackRow.id, {
      admin,
      product,
      personImageUrl,
      garmentImageUrl,
      settings,
      pollIntervalMs,
      maxPollAttempts,
    });
  }

  if (error || !row) {
    return NextResponse.json({ error: error?.message ?? "Could not create session" }, { status: 400 });
  }

  return continueSession(row.id, {
    admin,
    product,
    personImageUrl,
    garmentImageUrl,
    settings,
    pollIntervalMs,
    maxPollAttempts,
  });
}

async function continueSession(
  sessionId: string,
  ctx: {
    admin: ReturnType<typeof createAdminClient>;
    product: NonNullable<Awaited<ReturnType<typeof getProductById>>>;
    personImageUrl: string;
    garmentImageUrl: string;
    settings: Awaited<ReturnType<typeof getResolvedTryOnSettings>>;
    pollIntervalMs: number;
    maxPollAttempts: number;
  },
) {
  const aiReady = await isTryOnAiConfigured();

  if (aiReady) {
    const { detailsText, metadata } = buildTryOnProductContext(ctx.product);
    try {
      const job = await startTryOnJob({
        personImageUrl: ctx.personImageUrl,
        garmentImageUrl: ctx.garmentImageUrl,
        productDetails: detailsText,
        productMetadata: metadata,
        settings: ctx.settings,
      });
      const rate = listedTryOnRate(ctx.settings.configuredMode, ctx.settings.submitJobUrl);
      await ctx.admin
        .from("try_on_sessions")
        .update({
          runpod_job_id: job.id,
          runpod_endpoint_mode: rate?.mode ?? null,
        })
        .eq("id", sessionId);
    } catch (jobError) {
      await ctx.admin.from("try_on_sessions").update({ status: "failed" }).eq("id", sessionId);
      return NextResponse.json(
        { error: jobError instanceof Error ? jobError.message : "RunPod failed" },
        { status: 502 },
      );
    }
  } else if (ctx.settings.useStubWhenUnconfigured) {
    await ctx.admin
      .from("try_on_sessions")
      .update({
        runpod_job_id: `stub-${sessionId}`,
        result_image_url: ctx.garmentImageUrl,
        status: "processing",
      })
      .eq("id", sessionId);
  } else {
    await ctx.admin.from("try_on_sessions").update({ status: "failed" }).eq("id", sessionId);
    return NextResponse.json(
      { error: "Virtual try-on is not configured. Ask an admin to set up RunPod in Try-on AI settings." },
      { status: 503 },
    );
  }

  return NextResponse.json({
    sessionId,
    status: "processing",
    pollIntervalMs: ctx.pollIntervalMs,
    maxPollAttempts: ctx.maxPollAttempts,
  });
}
