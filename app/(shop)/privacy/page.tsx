import { getShopSettings } from "@/lib/shop-settings";

export default async function PrivacyPage() {
  const shop = await getShopSettings();
  return (
    <article className="mx-auto max-w-2xl space-y-5">
      <h1 className="font-heading text-4xl tracking-tight">Privacy</h1>
      <p className="text-muted-foreground">
        Trinity Styles uses your account email for orders and sign-in. Checkout stores your delivery address and phone
        so we can ship your order and reach you about delivery.
      </p>
      <p className="text-muted-foreground">
        Virtual try-on uploads your photo to our servers and sends it to our try-on provider to generate a preview. We
        keep try-on photos in private storage linked to your session. Do not upload someone else&apos;s photo without
        their permission.
      </p>
      <p className="text-muted-foreground">
        We record which shop pages are viewed (path and an anonymous cookie) so we can see traffic on the admin
        dashboard. We do not sell this data.
      </p>
      <p className="text-muted-foreground">
        To ask about your data or request deletion of try-on photos, contact us
        {shop.contactEmail ? ` at ${shop.contactEmail}` : shop.contactPhone ? ` on ${shop.contactPhone}` : ""}.
      </p>
    </article>
  );
}
