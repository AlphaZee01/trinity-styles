/** Bank of Ghana USDGHS mid rate published for 2 Nov 2026. */
export const USD_TO_GHS = 11.66;

export function usdToGhs(amountUsd: number) {
  return amountUsd * USD_TO_GHS;
}

export function formatUsd(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(amount);
}

export function formatGhs(amount: number) {
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `GH₵${formatted}`;
}

export function toPesewas(amountGhs: number) {
  return Math.round(amountGhs * 100);
}

export function variantPrice(
  basePrice: number,
  priceOverride: number | null | undefined,
) {
  return priceOverride ?? basePrice;
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
