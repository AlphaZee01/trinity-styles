import { variantPrice } from "@/lib/format";

type VariantRow = {
  id: string;
  stock: number;
  price_override: number | null;
  products: { base_price: number } | { base_price: number }[];
};

export function orderLineTotals(
  items: { variantId: string; quantity: number }[],
  variants: VariantRow[],
) {
  let subtotal = 0;
  const lines = items.map((item) => {
    const variant = variants.find((row) => row.id === item.variantId);
    if (!variant) throw new Error("A cart item is no longer available.");
    if (variant.stock < item.quantity) throw new Error("Not enough stock for one of your items.");
    const product = variant.products as { base_price: number };
    const price = variantPrice(Number(product.base_price), variant.price_override);
    subtotal += price * item.quantity;
    return { variant_id: item.variantId, quantity: item.quantity, price_at_purchase: price };
  });
  return { subtotal, lines };
}

export function checkoutGrandTotal(subtotal: number, shippingFeeGhs: number) {
  return subtotal + shippingFeeGhs;
}
