import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { getPaystackSecret, isServiceRoleConfigured } from "@/lib/env";
import { fulfillPaidOrder } from "@/lib/orders";
import { verifyTransaction } from "@/lib/paystack";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const { userId, role } = await getAuthContext();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const reference = new URL(request.url).searchParams.get("reference");
  if (!reference) {
    return NextResponse.json({ error: "Missing reference" }, { status: 400 });
  }
  if (!getPaystackSecret() || !isServiceRoleConfigured()) {
    return NextResponse.json({ error: "Payments are not configured" }, { status: 503 });
  }

  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("id, user_id, status")
    .eq("paystack_reference", reference)
    .maybeSingle();
  if (!order || (order.user_id !== userId && role !== "admin")) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const payment = await verifyTransaction(reference);
  if (payment.status === "success") {
    const result = await fulfillPaidOrder(reference);
    return NextResponse.json({ status: "paid", orderId: result.orderId ?? order.id });
  }
  return NextResponse.json({ status: order.status === "paid" ? "paid" : "pending", orderId: order.id });
}
