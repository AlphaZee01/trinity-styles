import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isServiceRoleConfigured } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

const visitorCookie = "ts_visitor";

function shopPath(value: unknown) {
  if (typeof value !== "string") return null;
  const path = value.split("?")[0]?.split("#")[0] ?? "";
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\") || path.includes("..")) return null;
  if (path.startsWith("/admin") || path.startsWith("/api")) return null;
  if (path.length > 200) return null;
  return path;
}

export async function POST(request: Request) {
  if (!isServiceRoleConfigured()) return new NextResponse(null, { status: 204 });

  let payload: { path?: unknown };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const path = shopPath(payload.path);
  if (!path) return NextResponse.json({ error: "Invalid path" }, { status: 400 });

  const jar = await cookies();
  const current = jar.get(visitorCookie)?.value ?? "";
  const visitorId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(current)
    ? current
    : crypto.randomUUID();

  const admin = createAdminClient();
  await admin.from("page_views").insert({ path, visitor_id: visitorId });

  const response = new NextResponse(null, { status: 204 });
  response.cookies.set(visitorCookie, visitorId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 400,
  });
  return response;
}
