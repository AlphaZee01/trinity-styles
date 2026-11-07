import { CheckoutForm } from "@/components/checkout/checkout-form";
import { requireUser } from "@/lib/auth";
import { shippingFromProfile } from "@/lib/shipping";

export default async function CheckoutPage() {
  const { profile } = await requireUser();
  return (
    <div className="space-y-8">
      <h1 className="font-heading text-4xl tracking-tight">Checkout</h1>
      <CheckoutForm defaults={shippingFromProfile(profile)} />
    </div>
  );
}
