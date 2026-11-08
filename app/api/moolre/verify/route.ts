import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { isServiceRoleConfigured } from "@/lib/env";
import { checkPaymentStatus, isMoolreConfigured, isPaymentFailed, isPaymentSuccessful } from "@/lib/moolre";
import { cancelPendingOrder, fulfillPaidOrder } from "@/lib/orders";
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
  if (!isMoolreConfigured() || !isServiceRoleConfigured()) {
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

  if (order.status === "paid") {
    return NextResponse.json({ status: "paid", orderId: order.id });
  }
  if (order.status === "cancelled") {
    return NextResponse.json({ status: "failed", orderId: order.id });
  }

  const payment = await checkPaymentStatus(reference);
  if (isPaymentSuccessful(payment)) {
    const result = await fulfillPaidOrder(reference);
    if (result.ok) {
      return NextResponse.json({ status: "paid", orderId: result.orderId ?? order.id });
    }
    if (result.reason === "stock") {
      return NextResponse.json({
        status: "pending",
        orderId: order.id,
        error: "Payment received but an item sold out. We will contact you.",
      });
    }
  }
  if (isPaymentFailed(payment)) {
    await cancelPendingOrder(reference);
    return NextResponse.json({ status: "failed", orderId: order.id });
  }
  return NextResponse.json({ status: "pending", orderId: order.id });
}
