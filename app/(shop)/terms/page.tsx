import { getShopSettings } from "@/lib/shop-settings";

export default async function TermsPage() {
  const shop = await getShopSettings();
  return (
    <article className="mx-auto max-w-2xl space-y-5">
      <h1 className="font-heading text-4xl tracking-tight">Terms</h1>
      <p className="text-muted-foreground">
        Prices on Trinity Styles are in Ghana cedis (GHS). Paying by Mobile Money means you approve the total shown at
        checkout, including delivery, on the wallet number you provide.
      </p>
      <p className="text-muted-foreground">
        An order is confirmed when Moolre marks it paid. If an item sells out before payment completes, we may cancel the
        order and ask you to try again.
      </p>
      <p className="text-muted-foreground whitespace-pre-wrap">{shop.returnsPolicy}</p>
      <p className="text-muted-foreground">
        Questions about an order? Reach us
        {shop.contactEmail ? ` at ${shop.contactEmail}` : shop.contactPhone ? ` on ${shop.contactPhone}` : " through the shop footer"}.
      </p>
    </article>
  );
}
