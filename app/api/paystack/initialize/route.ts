import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { getAppUrl, getPaystackSecret, isServiceRoleConfigured } from "@/lib/env";
import { toPesewas, variantPrice } from "@/lib/format";
import { initializeTransaction } from "@/lib/paystack";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { ShippingAddress } from "@/lib/types";

export async function POST(request: Request) {
  const { userId } = await getAuthContext();
  if (!userId) {
    return NextResponse.json({ error: "Sign in to checkout." }, { status: 401 });
  }
  if (!getPaystackSecret() || !isServiceRoleConfigured()) {
    return NextResponse.json(
      { error: "Paystack and Supabase keys are required for checkout." },
      { status: 503 },
    );
  }

  const body = (await request.json()) as {
    items?: { variantId: string; quantity: number }[];
    shippingAddress?: ShippingAddress;
  };
  const items = body.items ?? [];
  const shipping = body.shippingAddress;
  if (!items.length || !shipping?.full_name || !shipping.phone || !shipping.address_line) {
    return NextResponse.json({ error: "Add items and a complete shipping address." }, { status: 400 });
  }

  const admin = createAdminClient();
  const variantIds = items.map((item) => item.variantId);
  const { data: variants, error } = await admin
    .from("product_variants")
    .select("id, stock, price_override, product_id, products(base_price, name)")
    .in("id", variantIds);
  if (error || !variants) {
    return NextResponse.json({ error: "Could not load variants" }, { status: 400 });
  }

  let total = 0;
  const orderItems = items.map((item) => {
    const variant = variants.find((row) => row.id === item.variantId);
    if (!variant) throw new Error("A cart item is no longer available.");
    if (variant.stock < item.quantity) throw new Error("Not enough stock for one of your items.");
    const product = variant.products as unknown as { base_price: number };
    const price = variantPrice(Number(product.base_price), variant.price_override);
    total += price * item.quantity;
    return { variant_id: item.variantId, quantity: item.quantity, price_at_purchase: price };
  });

  const reference = `TS-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
  const { data: order, error: orderError } = await admin
    .from("orders")
    .insert({
      user_id: userId,
      status: "pending",
      total_amount: total,
      paystack_reference: reference,
      shipping_address: shipping,
    })
    .select("id")
    .single();
  if (orderError || !order) {
    return NextResponse.json({ error: orderError?.message ?? "Could not create order" }, { status: 400 });
  }

  const { error: itemsError } = await admin.from("order_items").insert(
    orderItems.map((item) => ({ ...item, order_id: order.id })),
  );
  if (itemsError) {
    return NextResponse.json({ error: itemsError.message }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  try {
    const paystack = await initializeTransaction({
      email: user?.email ?? `${userId}@customers.trinitystyles.gh`,
      amount: toPesewas(total),
      reference,
      callback_url: `${getAppUrl()}/checkout/success`,
      metadata: { orderId: order.id, userId },
    });
    return NextResponse.json({
      authorizationUrl: paystack.authorization_url,
      reference,
      orderId: order.id,
    });
  } catch (paystackError) {
    return NextResponse.json(
      { error: paystackError instanceof Error ? paystackError.message : "Paystack failed" },
      { status: 502 },
    );
  }
}
