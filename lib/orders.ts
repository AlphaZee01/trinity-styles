import { createAdminClient } from "@/lib/supabase/admin";
import type { OrderStatus } from "@/lib/types";

const PAID_PATH: OrderStatus[] = ["paid", "processing", "shipped", "delivered"];

export async function fulfillPaidOrder(reference: string) {
  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("id, status")
    .eq("paystack_reference", reference)
    .maybeSingle();
  if (!order) return { ok: false as const, reason: "missing" };
  if (order.status !== "pending") return { ok: true as const, already: true, orderId: order.id };

  const { data: decremented, error: rpcError } = await admin.rpc("decrement_stock_for_order", {
    p_order_id: order.id,
  });
  if (rpcError || !decremented) {
    return { ok: false as const, reason: "stock", orderId: order.id };
  }

  const { data: updated } = await admin
    .from("orders")
    .update({ status: "paid" })
    .eq("id", order.id)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();
  if (!updated) return { ok: true as const, already: true, orderId: order.id };

  return { ok: true as const, already: false, orderId: order.id };
}

export async function cancelPendingOrder(reference: string) {
  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("id, status")
    .eq("paystack_reference", reference)
    .maybeSingle();
  if (!order || order.status !== "pending") return;
  await admin.from("orders").update({ status: "cancelled" }).eq("id", order.id).eq("status", "pending");
}

export async function updateAdminOrder(
  orderId: string,
  patch: { status?: OrderStatus; trackingNumber?: string | null; previousStatus?: OrderStatus },
) {
  const admin = createAdminClient();

  if (patch.status) {
    const previous = patch.previousStatus;
    if (patch.status === "cancelled" && previous && PAID_PATH.includes(previous)) {
      const { data: order } = await admin
        .from("orders")
        .select("id, stock_restored_at")
        .eq("id", orderId)
        .maybeSingle();
      if (order && !order.stock_restored_at) {
        await admin.rpc("restore_stock_for_order", { p_order_id: orderId });
        await admin.from("orders").update({ stock_restored_at: new Date().toISOString() }).eq("id", orderId);
      }
    }
    const { error } = await admin.from("orders").update({ status: patch.status }).eq("id", orderId);
    if (error) throw error;
  }

  if (patch.trackingNumber !== undefined) {
    const { error } = await admin
      .from("orders")
      .update({ tracking_number: patch.trackingNumber?.trim() || null })
      .eq("id", orderId);
    if (error) throw error;
  }
}

export async function deleteAdminOrder(orderId: string) {
  const admin = createAdminClient();
  const { data: order, error: readError } = await admin
    .from("orders")
    .select("id, status, stock_restored_at")
    .eq("id", orderId)
    .maybeSingle();
  if (readError) throw new Error(readError.message);
  if (!order) throw new Error("Order not found.");

  const status = order.status as OrderStatus;
  if (PAID_PATH.includes(status) && !order.stock_restored_at) {
    const { error: restoreError } = await admin.rpc("restore_stock_for_order", { p_order_id: orderId });
    if (restoreError) throw new Error(restoreError.message);
  }

  const { error } = await admin.from("orders").delete().eq("id", orderId);
  if (error) throw new Error(error.message);
}
