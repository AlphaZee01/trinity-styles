import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { checkoutGrandTotal, orderLineTotals } from "@/lib/checkout-totals";
import { isServiceRoleConfigured } from "@/lib/env";
import {
  initiateCollection,
  interpretInitiateResponse,
  isMoolreConfigured,
  normalizeMoMoPhone,
  type MoolreChannel,
} from "@/lib/moolre";
import { rateLimit } from "@/lib/rate-limit";
import { getShopSettingsRow } from "@/lib/shop-settings";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ShippingAddress } from "@/lib/types";

const CHANNELS = new Set<MoolreChannel>(["13", "6", "7"]);

function payerPhone(shipping: ShippingAddress, momoPhone?: string) {
  const wallet = momoPhone?.trim() || shipping.momo_phone?.trim() || shipping.phone.trim();
  return normalizeMoMoPhone(wallet);
}

async function completeInitiate(
  channel: MoolreChannel,
  payer: string,
  total: number,
  externalref: string,
  otp?: string,
) {
  let json = await initiateCollection({
    channel,
    payer,
    amountGhs: total,
    externalref,
    otpcode: otp,
  });
  let outcome = interpretInitiateResponse(json);

  if (outcome.kind === "otp_required" || outcome.kind === "invalid_otp" || outcome.kind === "error") {
    return outcome;
  }

  if (json.message?.toLowerCase().includes("otp verified")) {
    json = await initiateCollection({
      channel,
      payer,
      amountGhs: total,
      externalref,
    });
    outcome = interpretInitiateResponse(json);
  }

  return outcome;
}

export async function POST(request: Request) {
  const { userId } = await getAuthContext();
  if (!userId) {
    return NextResponse.json({ error: "Sign in to checkout." }, { status: 401 });
  }
  if (!rateLimit(`checkout:${userId}`, 8, 10 * 60_000).ok) {
    return NextResponse.json({ error: "Too many payment attempts. Wait a few minutes." }, { status: 429 });
  }
  if (!isMoolreConfigured() || !isServiceRoleConfigured()) {
    return NextResponse.json(
      { error: "Moolre and Supabase keys are required for checkout." },
      { status: 503 },
    );
  }

  const body = (await request.json()) as {
    items?: { variantId: string; quantity: number }[];
    shippingAddress?: ShippingAddress;
    momoPhone?: string;
    channel?: string;
    otp?: string;
    reference?: string;
  };

  const channel = body.channel as MoolreChannel | undefined;
  if (!channel || !CHANNELS.has(channel)) {
    return NextResponse.json({ error: "Choose your mobile network." }, { status: 400 });
  }

  const admin = createAdminClient();
  let reference = body.reference?.trim();
  let total = 0;
  let payer = "";
  let orderId: string;

  if (reference) {
    const { data: order } = await admin
      .from("orders")
      .select("id, user_id, status, total_amount, shipping_address, paystack_reference")
      .eq("paystack_reference", reference)
      .maybeSingle();
    if (!order || order.user_id !== userId || order.status !== "pending") {
      return NextResponse.json({ error: "Order not found or already paid." }, { status: 404 });
    }
    total = Number(order.total_amount);
    payer = payerPhone(order.shipping_address as ShippingAddress);
    orderId = order.id;
    reference = order.paystack_reference;
  } else {
    const items = body.items ?? [];
    const shipping = body.shippingAddress;
    if (!items.length || !shipping?.full_name || !shipping.phone || !shipping.address_line) {
      return NextResponse.json({ error: "Add items and a complete shipping address." }, { status: 400 });
    }

    const variantIds = items.map((item) => item.variantId);
    const { data: variants, error } = await admin
      .from("product_variants")
      .select("id, stock, price_override, product_id, products(base_price, name)")
      .in("id", variantIds);
    if (error || !variants) {
      return NextResponse.json({ error: "Could not load variants" }, { status: 400 });
    }

    let orderItems;
    let subtotal = 0;
    try {
      const totals = orderLineTotals(items, variants as Parameters<typeof orderLineTotals>[1]);
      subtotal = totals.subtotal;
      orderItems = totals.lines;
    } catch (lineError) {
      return NextResponse.json(
        { error: lineError instanceof Error ? lineError.message : "Invalid cart" },
        { status: 400 },
      );
    }

    const shop = await getShopSettingsRow();
    const shippingFee = Number(shop.shipping_fee_ghs);
    total = checkoutGrandTotal(subtotal, shippingFee);
    payer = payerPhone(shipping, body.momoPhone);

    const address: ShippingAddress = {
      ...shipping,
      momo_phone: body.momoPhone?.trim() || shipping.momo_phone?.trim() || shipping.phone.trim(),
    };

    reference = `TS-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
    const { data: order, error: orderError } = await admin
      .from("orders")
      .insert({
        user_id: userId,
        status: "pending",
        total_amount: total,
        shipping_fee: shippingFee,
        paystack_reference: reference,
        shipping_address: address,
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
    orderId = order.id;
  }

  if (!reference) {
    return NextResponse.json({ error: "Missing payment reference." }, { status: 400 });
  }

  try {
    const outcome = await completeInitiate(channel, payer, total, reference, body.otp?.trim());

    if (outcome.kind === "otp_required") {
      return NextResponse.json({
        status: "otp_required",
        message: outcome.message,
        reference,
        orderId,
      });
    }
    if (outcome.kind === "invalid_otp") {
      return NextResponse.json({ error: outcome.message, status: "invalid_otp" }, { status: 400 });
    }
    if (outcome.kind === "payment_requested") {
      return NextResponse.json({
        status: "payment_requested",
        message: outcome.message,
        reference,
        orderId,
      });
    }
    return NextResponse.json({ error: outcome.message }, { status: 502 });
  } catch (moolreError) {
    return NextResponse.json(
      { error: moolreError instanceof Error ? moolreError.message : "Moolre failed" },
      { status: 502 },
    );
  }
}
