import "server-only";

import { isServiceRoleConfigured } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

const PRIVATE_BUCKETS = new Set(["user-photos", "try-on-results"]);

function storageObject(stored: string) {
  const trimmed = stored.trim();
  if (!trimmed || trimmed.startsWith("data:")) return null;
  try {
    const url = new URL(trimmed);
    const match = url.pathname.match(/\/storage\/v1\/object\/(?:sign|public|authenticated)\/([^/]+)\/(.+)$/);
    if (!match) return null;
    return { bucket: match[1], path: decodeURIComponent(match[2]) };
  } catch {
    if (trimmed.includes("://")) return null;
    return { bucket: "try-on-results", path: trimmed.replace(/^try-on-results\//, "") };
  }
}

export async function viewableTryOnImage(stored: string | null) {
  if (!stored || stored.startsWith("data:")) return null;
  if (!isServiceRoleConfigured()) return stored.startsWith("http") ? stored : null;
  const object = storageObject(stored);
  if (!object || !PRIVATE_BUCKETS.has(object.bucket)) return stored.startsWith("http") ? stored : null;
  const admin = createAdminClient();
  const signed = await admin.storage.from(object.bucket).createSignedUrl(object.path, 60 * 60);
  return signed.data?.signedUrl ?? (stored.startsWith("http") ? stored : null);
}

export async function persistTryOnResultImage(input: {
  sessionId: string;
  userId: string | null;
  sourceUrl: string;
}) {
  const admin = createAdminClient();
  const folder = input.userId ?? "guest";
  const path = `${folder}/${input.sessionId}.jpg`;

  const response = await fetch(input.sourceUrl, {
    headers: { Accept: "image/*" },
    redirect: "follow",
  });
  if (!response.ok) {
    throw new Error(`Could not download try-on result (${response.status})`);
  }

  const bytes = await response.arrayBuffer();
  if (bytes.byteLength === 0) {
    throw new Error("Try-on result image was empty");
  }

  const contentType = response.headers.get("content-type")?.startsWith("image/")
    ? response.headers.get("content-type")!
    : "image/jpeg";

  const { error } = await admin.storage.from("try-on-results").upload(path, bytes, {
    contentType,
    upsert: true,
  });
  if (error) {
    throw new Error(error.message);
  }

  const signed = await admin.storage.from("try-on-results").createSignedUrl(path, 60 * 60);
  return signed.data?.signedUrl ?? path;
}
