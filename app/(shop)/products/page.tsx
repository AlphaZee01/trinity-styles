import { ProductCard } from "@/components/product/product-card";
import { EmptyState } from "@/components/states";
import { listCategoryNames } from "@/lib/categories";
import { listProducts } from "@/lib/products";
import Link from "next/link";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; size?: string; color?: string; min?: string; max?: string; q?: string }>;
}) {
  const params = await searchParams;
  const catalog = await listProducts();
  const categories = await listCategoryNames(catalog.map((product) => product.category));
  const products = await listProducts({
    category: params.category,
    size: params.size,
    color: params.color,
    minPrice: params.min ? Number(params.min) : undefined,
    maxPrice: params.max ? Number(params.max) : undefined,
    query: params.q,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-4xl tracking-tight">Shop</h1>
        <p className="mt-2 text-muted-foreground">Filter by category, size, colour, and price in GHS.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link
          href="/products"
          className="rounded-full border border-border px-3 py-2 text-sm"
        >
          All
        </Link>
        {categories.map((category) => (
          <Link
            key={category}
            href={`/products?category=${encodeURIComponent(category)}`}
            className={`rounded-full border px-3 py-2 text-sm ${
              params.category === category ? "border-foreground bg-foreground text-background" : "border-border"
            }`}
          >
            {category}
          </Link>
        ))}
      </div>
      <form className="grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-4" method="get">
        {params.category ? <input type="hidden" name="category" value={params.category} /> : null}
        <input
          name="q"
          defaultValue={params.q ?? ""}
          placeholder="Search pieces"
          aria-label="Search pieces"
          className="h-11 rounded-lg border border-input bg-background px-3 sm:col-span-4"
        />
        <input
          name="size"
          defaultValue={params.size ?? ""}
          placeholder="Size (S, M, L)"
          className="h-11 rounded-lg border border-input bg-background px-3"
        />
        <input
          name="color"
          defaultValue={params.color ?? ""}
          placeholder="Colour"
          className="h-11 rounded-lg border border-input bg-background px-3"
        />
        <input
          name="min"
          defaultValue={params.min ?? ""}
          placeholder="Min GHS"
          type="number"
          className="h-11 rounded-lg border border-input bg-background px-3"
        />
        <input
          name="max"
          defaultValue={params.max ?? ""}
          placeholder="Max GHS"
          type="number"
          className="h-11 rounded-lg border border-input bg-background px-3"
        />
        <button type="submit" className="h-11 rounded-lg bg-foreground px-4 text-sm text-background sm:col-span-4">
          Apply filters
        </button>
      </form>
      {products.length === 0 ? (
        <EmptyState
          title="Nothing matches those filters"
          description="Try clearing category or widening the price range. A very long product name like Supercalifragilistic Extra-Oversized Drawstring Trousers would still wrap here."
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-8">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
