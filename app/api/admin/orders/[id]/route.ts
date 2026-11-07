import { NextResponse } from "next/server";
import { setOrderStatus } from "@/lib/admin-data";
import { getAuthContext } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";
import type { OrderStatus } from "@/lib/types";

const allowed: OrderStatus[] = ["pending", "paid", "processing", "shipped", "delivered", "cancelled"];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (isSupabaseConfigured()) {
    const { role } = await getAuthContext();
    if (role !== "admin") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }
  }

  const { id } = await params;
  const body = (await request.json()) as { status?: OrderStatus };
  if (!body.status || !allowed.includes(body.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  try {
    await setOrderStatus(id, body.status);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update order" },
      { status: 400 },
    );
  }
}
