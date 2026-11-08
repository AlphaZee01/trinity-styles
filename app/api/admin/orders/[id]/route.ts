import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { isServiceRoleConfigured } from "@/lib/env";
import { updateAdminOrder } from "@/lib/orders";
import { createAdminClient } from "@/lib/supabase/admin";
import type { OrderStatus } from "@/lib/types";

const allowed: OrderStatus[] = ["pending", "paid", "processing", "shipped", "delivered", "cancelled"];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isServiceRoleConfigured()) {
    return NextResponse.json({ error: "Connect Supabase to update orders." }, { status: 503 });
  }
  const { role } = await getAuthContext();
  if (role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const { id } = await params;
  const body = (await request.json()) as { status?: OrderStatus; trackingNumber?: string | null };
  if (body.status && !allowed.includes(body.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  if (!body.status && body.trackingNumber === undefined) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: current } = await admin.from("orders").select("status").eq("id", id).maybeSingle();
  if (!current) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  try {
    await updateAdminOrder(id, {
      status: body.status,
      trackingNumber: body.trackingNumber,
      previousStatus: current.status as OrderStatus,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update order" },
      { status: 400 },
    );
  }
}
