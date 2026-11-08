import Image from "next/image";
import Link from "next/link";
import { DeleteProductButton } from "@/components/admin/delete-product-button";
import { EmptyState } from "@/components/states";
import { formatGhs } from "@/lib/format";
import { listAllProducts } from "@/lib/products";

export default async function AdminProductsPage() {
  const products = await listAllProducts();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-4xl tracking-tight">Products</h1>
          <p className="mt-2 text-muted-foreground">Catalog, variants, and stock.</p>
        </div>
        <Link href="/admin/products/new" className="press inline-flex h-11 items-center justify-center rounded-full bg-primary px-4 text-sm text-primary-foreground">
          New product
        </Link>
      </div>
      {products.length === 0 ? (
        <EmptyState title="No products" description="Add a first piece with images, sizes, and GHS pricing." />
      ) : (
        <ul className="space-y-3">
          {products.map((product) => {
            const stock = product.product_variants.reduce((sum, variant) => sum + variant.stock, 0);
            return (
              <li key={product.id} className="glass flex items-center gap-3 rounded-2xl p-3">
                <Link href={`/admin/products/${product.id}`} className="press flex min-w-0 flex-1 items-center gap-3">
                  <span className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                    {product.images[0] ? (
                      <Image src={product.images[0]} alt="" fill className="object-cover" sizes="64px" />
                    ) : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium break-words">{product.name}</span>
                    <span className="mt-1 block text-sm break-words text-muted-foreground">
                      {product.category} · {stock} in stock · {product.is_active ? "Active" : "Hidden"}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm">{formatGhs(Number(product.base_price))}</span>
                </Link>
                <DeleteProductButton id={product.id} name={product.name} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
