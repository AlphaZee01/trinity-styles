import { getShopSettings } from "@/lib/shop-settings";

export default async function ShippingReturnsPage() {
  const shop = await getShopSettings();
  return (
    <article className="mx-auto max-w-2xl space-y-6 prose-headings:font-heading prose-headings:tracking-tight">
      <h1 className="font-heading text-4xl tracking-tight">Shipping & returns</h1>
      <section className="space-y-2">
        <h2 className="font-heading text-2xl">Delivery</h2>
        <p className="text-muted-foreground whitespace-pre-wrap">{shop.deliveryNote}</p>
        <p className="text-sm text-muted-foreground">
          Standard delivery is charged at checkout (currently GH₵{shop.shippingFeeGhs.toFixed(2)}).
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="font-heading text-2xl">Returns</h2>
        <p className="text-muted-foreground whitespace-pre-wrap">{shop.returnsPolicy}</p>
      </section>
    </article>
  );
}
