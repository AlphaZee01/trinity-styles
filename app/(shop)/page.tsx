import Link from "next/link";
import { HomeHero } from "@/components/shop/home-hero";
import { ProductOrbit, type OrbitProduct } from "@/components/shop/product-orbit";
import { ProductRail } from "@/components/shop/product-rail";
import { listProducts } from "@/lib/products";
import type { ProductWithVariants } from "@/lib/types";

function heroSlides(catalog: ProductWithVariants[]) {
  const urls: string[] = [];
  for (const product of catalog) {
    const src = product.images[0];
    if (!src || urls.includes(src)) continue;
    urls.push(src);
    if (urls.length >= 5) break;
  }
  return urls;
}

function toOrbitProduct(product: ProductWithVariants): OrbitProduct {
  const prices = product.product_variants.map((variant) => variant.price_override ?? product.base_price);
  const price = Math.min(...prices, product.base_price);
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    image: product.images[0] ?? null,
    price,
    compareAt: price < product.base_price ? product.base_price : null,
    category: product.category,
  };
}

const audiences = [
  { id: "all", label: "All", href: "/" },
  { id: "women", label: "Women", href: "/?tab=women" },
  { id: "men", label: "Men", href: "/?tab=men" },
  { id: "new", label: "New In", href: "/?tab=new" },
];

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const audience = tab === "women" || tab === "men" || tab === "new" ? tab : "all";
  const [catalog, newest] = await Promise.all([listProducts(), listProducts({ audience: "new" })]);
  const slides = heroSlides(catalog);
  const orbitProducts = catalog.map(toOrbitProduct);
  const products =
    audience === "women"
      ? catalog.filter((product) => product.gender !== "men")
      : audience === "men"
        ? catalog.filter((product) => product.gender !== "women")
        : audience === "new"
          ? [...catalog].sort((a, b) => b.created_at.localeCompare(a.created_at))
          : catalog;

  return (
    <div className="space-y-10">
      <HomeHero slides={slides} />

      <ProductOrbit products={orbitProducts} />

      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-heading text-2xl tracking-tight">All products</h2>
          <div className="flex flex-wrap gap-2" aria-label="Filter products">
            {audiences.map((item) => {
              const active = item.id === audience;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  scroll={false}
                  aria-current={active ? "page" : undefined}
                  className={`press flex h-10 items-center rounded-full px-4 text-sm ${
                    active ? "bg-primary text-primary-foreground" : "glass text-muted-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
        <ProductRail key={audience} products={products.map(toOrbitProduct)} newIds={audience === "new" ? newest.map((product) => product.id) : []} />
      </section>
    </div>
  );
}
