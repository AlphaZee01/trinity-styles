import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { isServiceRoleConfigured } from "@/lib/env";
import { SHOP_SETTINGS_ID, getShopSettingsRow } from "@/lib/shop-settings";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireAdminApi() {
  if (!isServiceRoleConfigured()) {
    return NextResponse.json({ error: "Connect Supabase to manage shop settings." }, { status: 503 });
  }
  const { role } = await getAuthContext();
  if (role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }
  return null;
}

export async function GET() {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const row = await getShopSettingsRow();
  return NextResponse.json({
    shippingFeeGhs: Number(row.shipping_fee_ghs),
    contactPhone: row.contact_phone,
    contactWhatsapp: row.contact_whatsapp,
    contactEmail: row.contact_email,
    returnsPolicy: row.returns_policy,
    deliveryNote: row.delivery_note,
    sizeGuideNote: row.size_guide_note,
    updatedAt: row.updated_at,
  });
}

export async function PATCH(request: Request) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const body = (await request.json()) as {
    shippingFeeGhs?: number;
    contactPhone?: string | null;
    contactWhatsapp?: string | null;
    contactEmail?: string | null;
    returnsPolicy?: string;
    deliveryNote?: string;
    sizeGuideNote?: string;
  };

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (typeof body.shippingFeeGhs === "number") {
    if (body.shippingFeeGhs < 0) {
      return NextResponse.json({ error: "Shipping fee cannot be negative." }, { status: 400 });
    }
    patch.shipping_fee_ghs = body.shippingFeeGhs;
  }
  if (body.contactPhone !== undefined) patch.contact_phone = body.contactPhone?.trim() || null;
  if (body.contactWhatsapp !== undefined) patch.contact_whatsapp = body.contactWhatsapp?.trim() || null;
  if (body.contactEmail !== undefined) patch.contact_email = body.contactEmail?.trim() || null;
  if (body.returnsPolicy !== undefined) {
    const text = body.returnsPolicy.trim();
    if (text.length < 10) {
      return NextResponse.json({ error: "Returns policy is too short." }, { status: 400 });
    }
    patch.returns_policy = text;
  }
  if (body.deliveryNote !== undefined) {
    const text = body.deliveryNote.trim();
    if (text.length < 10) {
      return NextResponse.json({ error: "Delivery note is too short." }, { status: 400 });
    }
    patch.delivery_note = text;
  }
  if (body.sizeGuideNote !== undefined) {
    const text = body.sizeGuideNote.trim();
    if (text.length < 5) {
      return NextResponse.json({ error: "Size guide note is too short." }, { status: 400 });
    }
    patch.size_guide_note = text;
  }

  const admin = createAdminClient();
  const { error } = await admin.from("shop_settings").update(patch).eq("id", SHOP_SETTINGS_ID);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const row = await getShopSettingsRow();
  return NextResponse.json({
    shippingFeeGhs: Number(row.shipping_fee_ghs),
    contactPhone: row.contact_phone,
    contactWhatsapp: row.contact_whatsapp,
    contactEmail: row.contact_email,
    returnsPolicy: row.returns_policy,
    deliveryNote: row.delivery_note,
    sizeGuideNote: row.size_guide_note,
    updatedAt: row.updated_at,
  });
}
