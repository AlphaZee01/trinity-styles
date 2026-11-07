import type { ProductWithVariants } from "@/lib/types";

const img = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=80`;

export const demoCatalog: ProductWithVariants[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Accra Linen Shirt",
    slug: "accra-linen-shirt",
    description:
      "A breathable linen shirt cut for Ghana heat. Easy drape, hidden placket, and a slightly oversized shoulder.",
    base_price: 420,
    category: "Tops",
    gender: "women",
    images: [img("1521572163474-6864f9cf17ab"), img("1490481651871-ab68de25d43d")],
    is_active: true,
    created_at: "2026-10-01T00:00:00Z",
    updated_at: "2026-10-01T00:00:00Z",
    product_variants: [
      { id: "a1111111-1111-4111-8111-111111111111", product_id: "11111111-1111-4111-8111-111111111111", size: "S", color: "Ivory", sku: "ALS-IVY-S", stock: 8, price_override: null },
      { id: "a1111111-1111-4111-8111-111111111112", product_id: "11111111-1111-4111-8111-111111111111", size: "M", color: "Ivory", sku: "ALS-IVY-M", stock: 12, price_override: null },
      { id: "a1111111-1111-4111-8111-111111111113", product_id: "11111111-1111-4111-8111-111111111111", size: "L", color: "Sand", sku: "ALS-SND-L", stock: 6, price_override: 440 },
    ],
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    name: "Labadi Wide Trousers",
    slug: "labadi-wide-trousers",
    description: "High-rise wide trousers in a fluid viscose blend. Pockets sit clean. Hem skims the sandal.",
    base_price: 510,
    category: "Bottoms",
    gender: "unisex",
    images: [img("1594633312681-425c7b97ccd1"), img("1483985988355-763728e1935b")],
    is_active: true,
    created_at: "2026-10-01T00:00:00Z",
    updated_at: "2026-10-01T00:00:00Z",
    product_variants: [
      { id: "b2222222-2222-4222-8222-222222222221", product_id: "22222222-2222-4222-8222-222222222222", size: "S", color: "Black", sku: "LWT-BLK-S", stock: 4, price_override: null },
      { id: "b2222222-2222-4222-8222-222222222222", product_id: "22222222-2222-4222-8222-222222222222", size: "M", color: "Black", sku: "LWT-BLK-M", stock: 9, price_override: null },
      { id: "b2222222-2222-4222-8222-222222222223", product_id: "22222222-2222-4222-8222-222222222222", size: "M", color: "Olive", sku: "LWT-OLV-M", stock: 5, price_override: null },
    ],
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    name: "Cape Coast Wrap Dress",
    slug: "cape-coast-wrap-dress",
    description: "A wrap dress with a quiet print and a belt that actually stays. Mid-calf, sleeves you can roll.",
    base_price: 680,
    category: "Dresses",
    gender: "women",
    images: [img("1515372039744-b8f02a3ae446"), img("1496747611176-843222e1e57c")],
    is_active: true,
    created_at: "2026-10-01T00:00:00Z",
    updated_at: "2026-10-01T00:00:00Z",
    product_variants: [
      { id: "c3333333-3333-4333-8333-333333333331", product_id: "33333333-3333-4333-8333-333333333333", size: "S", color: "Clay", sku: "CWD-CLY-S", stock: 7, price_override: null },
      { id: "c3333333-3333-4333-8333-333333333332", product_id: "33333333-3333-4333-8333-333333333333", size: "M", color: "Clay", sku: "CWD-CLY-M", stock: 7, price_override: null },
      { id: "c3333333-3333-4333-8333-333333333333", product_id: "33333333-3333-4333-8333-333333333333", size: "L", color: "Indigo", sku: "CWD-IND-L", stock: 3, price_override: 720 },
    ],
  },
  {
    id: "44444444-4444-4444-8444-444444444444",
    name: "Kumasi Knit Polo",
    slug: "kumasi-knit-polo",
    description: "Fine-gauge knit polo. Soft collar, short sleeve, meant for evenings that start too warm.",
    base_price: 360,
    category: "Tops",
    gender: "men",
    images: [img("1523381294911-8d3cead13475"), img("1552374196-1ab2a1c593e8")],
    is_active: true,
    created_at: "2026-10-01T00:00:00Z",
    updated_at: "2026-10-01T00:00:00Z",
    product_variants: [
      { id: "d4444444-4444-4444-8444-444444444441", product_id: "44444444-4444-4444-8444-444444444444", size: "M", color: "Forest", sku: "KKP-FOR-M", stock: 10, price_override: null },
      { id: "d4444444-4444-4444-8444-444444444442", product_id: "44444444-4444-4444-8444-444444444444", size: "L", color: "Forest", sku: "KKP-FOR-L", stock: 8, price_override: null },
      { id: "d4444444-4444-4444-8444-444444444443", product_id: "44444444-4444-4444-8444-444444444444", size: "L", color: "Ecru", sku: "KKP-ECR-L", stock: 0, price_override: null },
    ],
  },
  {
    id: "55555555-5555-4555-8555-555555555555",
    name: "Osu Tailored Blazer",
    slug: "osu-tailored-blazer",
    description: "Unstructured blazer with a single button and a pocket that holds a phone without pulling.",
    base_price: 890,
    category: "Outerwear",
    gender: "unisex",
    images: [img("1594938291221-94f18cbb5660"), img("1487222477894-8943e31ef7b2")],
    is_active: true,
    created_at: "2026-10-01T00:00:00Z",
    updated_at: "2026-10-01T00:00:00Z",
    product_variants: [
      { id: "e5555555-5555-4555-8555-555555555551", product_id: "55555555-5555-4555-8555-555555555555", size: "S", color: "Charcoal", sku: "OTB-CHR-S", stock: 2, price_override: null },
      { id: "e5555555-5555-4555-8555-555555555552", product_id: "55555555-5555-4555-8555-555555555555", size: "M", color: "Charcoal", sku: "OTB-CHR-M", stock: 4, price_override: null },
    ],
  },
  {
    id: "66666666-6666-4666-8666-666666666666",
    name: "Volta Cotton Set",
    slug: "volta-cotton-set",
    description: "Matching shirt and short in washed cotton. Wear together or split across the week.",
    base_price: 740,
    category: "Sets",
    gender: "women",
    images: [img("1469334031218-e382a71b716b"), img("1551488831-00ddcb6c6bd3")],
    is_active: true,
    created_at: "2026-10-01T00:00:00Z",
    updated_at: "2026-10-01T00:00:00Z",
    product_variants: [
      { id: "f6666666-6666-4666-8666-666666666661", product_id: "66666666-6666-4666-8666-666666666666", size: "S", color: "Stone", sku: "VCS-STN-S", stock: 5, price_override: null },
      { id: "f6666666-6666-4666-8666-666666666662", product_id: "66666666-6666-4666-8666-666666666666", size: "M", color: "Stone", sku: "VCS-STN-M", stock: 5, price_override: null },
      { id: "f6666666-6666-4666-8666-666666666663", product_id: "66666666-6666-4666-8666-666666666666", size: "M", color: "Sage", sku: "VCS-SAG-M", stock: 4, price_override: 760 },
    ],
  },
];

export const categories = ["Tops", "Bottoms", "Dresses", "Outerwear", "Sets"];
export const sizes = ["S", "M", "L"];
export const colors = ["Black", "Charcoal", "Clay", "Ecru", "Forest", "Indigo", "Ivory", "Olive", "Sage", "Sand", "Stone"];

export function categoryOptions(used: string[] = []) {
  const names = [...categories];
  for (const name of used) {
    const trimmed = name.trim();
    if (trimmed && !names.some((item) => item.toLowerCase() === trimmed.toLowerCase())) names.push(trimmed);
  }
  return names;
}

export function mergeCategoryNames(primary: string[], extra: string[] = []) {
  const names = [...primary];
  for (const name of extra) {
    const trimmed = name.trim();
    if (trimmed && !names.some((item) => item.toLowerCase() === trimmed.toLowerCase())) names.push(trimmed);
  }
  return names;
}

export function isBuiltInCategory(name: string) {
  return categories.some((item) => item.toLowerCase() === name.trim().toLowerCase());
}

export function withCurrentOption(options: string[], current: string) {
  const trimmed = current.trim();
  if (trimmed && !options.includes(trimmed)) return [trimmed, ...options];
  return options;
}
