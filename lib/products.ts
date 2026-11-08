import { demoCatalog } from "@/lib/demo-catalog";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { ProductGender, ProductWithVariants } from "@/lib/types";

export type ProductFilters = {
  category?: string;
  size?: string;
  color?: string;
  minPrice?: number;
  maxPrice?: number;
  audience?: "women" | "men" | "new";
  gender?: ProductGender;
  query?: string;
};

function applyFilters(items: ProductWithVariants[], filters: ProductFilters) {
  let next = items.filter((product) => {
    if (filters.category && product.category !== filters.category) return false;
    if (filters.gender && product.gender !== filters.gender) return false;
    if (filters.query && !product.name.toLowerCase().includes(filters.query.toLowerCase())) return false;
    if (filters.audience === "women" && product.gender === "men") return false;
    if (filters.audience === "men" && product.gender === "women") return false;
    const variants = product.product_variants;
    if (filters.size && !variants.some((v) => v.size === filters.size)) return false;
    if (filters.color && !variants.some((v) => v.color === filters.color)) return false;
    const prices = variants.map((v) => v.price_override ?? product.base_price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    if (filters.minPrice != null && max < filters.minPrice) return false;
    if (filters.maxPrice != null && min > filters.maxPrice) return false;
    return true;
  });

  if (filters.audience === "new") {
    const sorted = [...next].sort((a, b) => b.created_at.localeCompare(a.created_at));
    const newest = sorted[0]?.created_at;
    const fresh = sorted.filter((product) => product.created_at === newest);
    if (fresh.length === sorted.length) return sorted.slice(0, 4);
    return fresh.length ? fresh : sorted.slice(0, 4);
  }

  return next;
}

async function fetchCatalog(activeOnly: boolean) {
  if (!isSupabaseConfigured()) return demoCatalog;

  try {
    const supabase = await createClient();
    let query = supabase.from("products").select("*, product_variants(*)").order("created_at", { ascending: false });
    if (activeOnly) query = query.eq("is_active", true);
    const { data, error } = await query;
    if (error || !data) return [];
    return data as ProductWithVariants[];
  } catch {
    return [];
  }
}

export async function listProducts(filters: ProductFilters = {}) {
  return applyFilters(await fetchCatalog(true), filters);
}

export async function listAllProducts() {
  return fetchCatalog(false);
}

export async function getProductBySlug(slug: string) {
  const products = await listProducts();
  return products.find((product) => product.slug === slug) ?? null;
}

export async function getProductById(id: string) {
  const products = await listProducts();
  return products.find((product) => product.id === id) ?? null;
}
