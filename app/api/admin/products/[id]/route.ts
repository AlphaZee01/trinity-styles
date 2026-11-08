import { NextResponse } from "next/server";
import { deleteProduct } from "@/lib/admin-data";
import { getAuthContext } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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

  const { id } = await params;
  try {
    await deleteProduct(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not delete product" },
      { status: 400 },
    );
  }
}
