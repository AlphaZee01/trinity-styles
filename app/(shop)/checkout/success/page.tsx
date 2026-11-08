import { SuccessClient } from "@/components/checkout/success-client";
import { getShopSettings } from "@/lib/shop-settings";

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string; trxref?: string }>;
}) {
  const params = await searchParams;
  const shop = await getShopSettings();
  return (
    <SuccessClient
      reference={params.reference ?? params.trxref ?? null}
      support={{
        phone: shop.contactPhone,
        whatsapp: shop.contactWhatsapp,
        email: shop.contactEmail,
      }}
    />
  );
}
