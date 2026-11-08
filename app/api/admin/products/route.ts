import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";
import { upsertProduct, type ProductPayload } from "@/lib/admin-data";

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }
  } else {
    const { role } = await getAuthContext();
    if (role !== "admin") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }
  }

  const body = (await request.json()) as ProductPayload & { id?: string | null };
  if (!body.name || !body.slug || !body.variants?.length) {
    return NextResponse.json({ error: "Name, slug, and at least one variant are required." }, { status: 400 });
  }

  try {
    const id = await upsertProduct(body.id ?? null, body);
    return NextResponse.json({ id });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not save product" },
      { status: 400 },
    );
  }
}
