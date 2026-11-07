import Image from "next/image";
import Link from "next/link";
import { OfferPrice } from "@/components/product/offer-price";
import { swatchColor } from "@/lib/swatches";
import type { ProductWithVariants } from "@/lib/types";

export function ProductCard({
  product,
  showNew = false,
}: {
  product: ProductWithVariants;
  showNew?: boolean;
}) {
  const image = product.images[0];
  const prices = product.product_variants.map((variant) => variant.price_override ?? product.base_price);
  const min = Math.min(...prices, product.base_price);
  const compareAt = min < product.base_price ? product.base_price : null;
  const colors = [...new Set(product.product_variants.map((variant) => variant.color))];

  return (
    <article className="min-w-0">
      <Link href={`/product/${product.slug}`} className="press group block">
        <div className="glass relative aspect-[3/4] overflow-hidden rounded-2xl bg-muted">
          {image ? (
            <Image
              src={image}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover transition-transform duration-200 ease-[var(--ease-out)] [@media(hover:hover)_and_(pointer:fine)]:group-hover:scale-[1.03]"
            />
          ) : (
            <div className="grid h-full place-items-center text-sm text-muted-foreground">No image</div>
          )}
          {showNew ? (
            <span className="absolute top-3 left-3 rounded-full bg-background/90 px-2 py-1 text-[10px] tracking-[0.14em] uppercase">
              New
            </span>
          ) : null}
        </div>
        <div className="mt-3 space-y-1">
          <h3 className="font-heading text-lg leading-tight tracking-tight text-pretty">{product.name}</h3>
          <OfferPrice price={min} compareAt={compareAt} saleClassName="text-sm" />
        </div>
      </Link>
      <div className="mt-2 flex gap-1.5">
        {colors.slice(0, 4).map((color) => (
          <span
            key={color}
            title={color}
            className="size-3 rounded-full border border-black/10"
            style={{ backgroundColor: swatchColor(color) }}
          />
        ))}
      </div>
    </article>
  );
}
