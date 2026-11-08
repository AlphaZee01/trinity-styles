import { CheckoutForm } from "@/components/checkout/checkout-form";
import { requireUser } from "@/lib/auth";
import { shippingFromProfile } from "@/lib/shipping";
import { getShopSettings } from "@/lib/shop-settings";

export default async function CheckoutPage() {
  const { profile } = await requireUser();
  const shop = await getShopSettings();
  return (
    <div className="space-y-8">
      <h1 className="font-heading text-4xl tracking-tight">Checkout</h1>
      <CheckoutForm defaults={shippingFromProfile(profile)} shippingFeeGhs={shop.shippingFeeGhs} />
    </div>
  );
}
