import { CartView } from "@/components/cart/cart-view";

export default function CartPage() {
  return (
    <div className="space-y-8">
      <h1 className="font-heading text-4xl tracking-tight">Bag</h1>
      <CartView />
    </div>
  );
}
