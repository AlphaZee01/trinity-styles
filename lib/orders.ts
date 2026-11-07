import { createAdminClient } from "@/lib/supabase/admin";

export async function fulfillPaidOrder(reference: string) {
  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("id, status")
    .eq("paystack_reference", reference)
    .maybeSingle();
  if (!order) return { ok: false as const, reason: "missing" };
  if (order.status !== "pending") return { ok: true as const, already: true, orderId: order.id };

  const { data: updated } = await admin
    .from("orders")
    .update({ status: "paid" })
    .eq("id", order.id)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();
  if (!updated) return { ok: true as const, already: true, orderId: order.id };

  const { data: items } = await admin
    .from("order_items")
    .select("variant_id, quantity")
    .eq("order_id", order.id);

  for (const item of items ?? []) {
    const { data: variant } = await admin
      .from("product_variants")
      .select("stock")
      .eq("id", item.variant_id)
      .single();
    const nextStock = Math.max(0, Number(variant?.stock ?? 0) - item.quantity);
    await admin.from("product_variants").update({ stock: nextStock }).eq("id", item.variant_id);
  }

  return { ok: true as const, already: false, orderId: order.id };
}
