import { isServiceRoleConfigured } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

export const SHOP_SETTINGS_ID = "00000000-0000-4000-8000-000000000002";

export type ShopSettingsRow = {
  id: string;
  shipping_fee_ghs: number;
  contact_phone: string | null;
  contact_whatsapp: string | null;
  contact_email: string | null;
  returns_policy: string;
  delivery_note: string;
  size_guide_note: string;
  updated_at: string;
};

export type ShopSettingsPublic = {
  shippingFeeGhs: number;
  contactPhone: string | null;
  contactWhatsapp: string | null;
  contactEmail: string | null;
  returnsPolicy: string;
  deliveryNote: string;
  sizeGuideNote: string;
};

const defaults: ShopSettingsPublic = {
  shippingFeeGhs: 25,
  contactPhone: null,
  contactWhatsapp: null,
  contactEmail: null,
  returnsPolicy:
    "You may return unworn items within 7 days of delivery. Contact us to arrange a pick-up or drop-off. Refunds are sent to your Mobile Money wallet after we receive the piece.",
  deliveryNote:
    "We deliver across Ghana. Accra and Tema usually arrive in 2–3 working days; other regions may take 5–7 working days.",
  sizeGuideNote:
    "Sizes run true to the label. If you are between sizes, choose the larger size for an easy fit.",
};

function toPublic(row: ShopSettingsRow): ShopSettingsPublic {
  return {
    shippingFeeGhs: Number(row.shipping_fee_ghs),
    contactPhone: row.contact_phone?.trim() || null,
    contactWhatsapp: row.contact_whatsapp?.trim() || null,
    contactEmail: row.contact_email?.trim() || null,
    returnsPolicy: row.returns_policy,
    deliveryNote: row.delivery_note,
    sizeGuideNote: row.size_guide_note,
  };
}

export async function getShopSettingsRow(): Promise<ShopSettingsRow> {
  if (!isServiceRoleConfigured()) {
    return {
      id: SHOP_SETTINGS_ID,
      shipping_fee_ghs: defaults.shippingFeeGhs,
      contact_phone: defaults.contactPhone,
      contact_whatsapp: defaults.contactWhatsapp,
      contact_email: defaults.contactEmail,
      returns_policy: defaults.returnsPolicy,
      delivery_note: defaults.deliveryNote,
      size_guide_note: defaults.sizeGuideNote,
      updated_at: new Date(0).toISOString(),
    };
  }
  const admin = createAdminClient();
  const { data, error } = await admin.from("shop_settings").select("*").eq("id", SHOP_SETTINGS_ID).maybeSingle();
  if (error || !data) {
    return {
      id: SHOP_SETTINGS_ID,
      shipping_fee_ghs: defaults.shippingFeeGhs,
      contact_phone: defaults.contactPhone,
      contact_whatsapp: defaults.contactWhatsapp,
      contact_email: defaults.contactEmail,
      returns_policy: defaults.returnsPolicy,
      delivery_note: defaults.deliveryNote,
      size_guide_note: defaults.sizeGuideNote,
      updated_at: new Date(0).toISOString(),
    };
  }
  return data as ShopSettingsRow;
}

export async function getShopSettings(): Promise<ShopSettingsPublic> {
  return toPublic(await getShopSettingsRow());
}
