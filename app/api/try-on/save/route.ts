import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { isServiceRoleConfigured } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const { userId } = await getAuthContext();
  if (!userId) {
    return NextResponse.json({ error: "Sign in to save looks." }, { status: 401 });
  }
  if (!isServiceRoleConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured yet." }, { status: 503 });
  }

  const { sessionId, productId } = (await request.json()) as {
    sessionId?: string;
    productId?: string;
  };
  if (!sessionId || !productId) {
    return NextResponse.json({ error: "Missing session" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("saved_looks").insert({
    user_id: userId,
    try_on_session_id: sessionId,
    product_id: productId,
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
