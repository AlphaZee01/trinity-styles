import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { isServiceRoleConfigured, isSupabaseConfigured } from "@/lib/env";
import { prepareProductImage } from "@/lib/product-image";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  if (isSupabaseConfigured()) {
    const { role } = await getAuthContext();
    if (role !== "admin") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }
  }
  if (!isServiceRoleConfigured()) {
    return NextResponse.json({ error: "Connect Supabase to upload images." }, { status: 503 });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Choose an image" }, { status: 400 });
  }

  let prepared;
  try {
    prepared = await prepareProductImage(Buffer.from(await file.arrayBuffer()));
  } catch {
    return NextResponse.json({ error: "Could not read that image" }, { status: 400 });
  }

  const admin = createAdminClient();
  const baseName = file.name.replace(/[^a-zA-Z0-9.]/g, "-").replace(/\.[^.]+$/, "") || "photo";
  const path = `${crypto.randomUUID()}-${baseName}.jpg`;
  const { error } = await admin.storage.from("product-images").upload(path, prepared.bytes, {
    contentType: prepared.contentType,
    upsert: false,
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const { data } = admin.storage.from("product-images").getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
