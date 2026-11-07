import type { ProductWithVariants } from "@/lib/types";

function sanitizeDescription(text: string | null, maxLength = 400) {
  if (!text) return "";
  const stripped = text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (!stripped) return "";
  return stripped.length > maxLength ? `${stripped.slice(0, maxLength)}…` : stripped;
}

function stripEmptyFields(obj: Record<string, string | null | undefined>) {
  const cleaned: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value != null && String(value).trim() !== "") cleaned[key] = String(value).trim();
  }
  return cleaned;
}

export function buildTryOnProductContext(product: ProductWithVariants) {
  const descriptionText = sanitizeDescription(product.description);
  const detailParts = [
    product.name && `Product Name: ${product.name}`,
    product.category && `Category: ${product.category}`,
    descriptionText && `Description: ${descriptionText}`,
  ].filter(Boolean);

  const metadata = stripEmptyFields({
    product_id: product.id,
    product_name: product.name,
    category: product.category,
    description: descriptionText || null,
  });

  return {
    detailsText: detailParts.join(". "),
    metadata,
  };
}
