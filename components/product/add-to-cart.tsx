"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CircleHelp, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { TryOnPanel } from "@/components/try-on/try-on-panel";
import { useHydrated } from "@/hooks/use-hydrated";
import { variantPrice } from "@/lib/format";
import { OfferPrice } from "@/components/product/offer-price";
import { swatchColor } from "@/lib/swatches";
import type { ProductWithVariants } from "@/lib/types";
import { useCart } from "@/store/cart";

const features: Record<string, { title: string; detail: string; icon: "leaf" | "wind" | "fit" }[]> = {
  Tops: [
    { title: "Natural fabric", detail: "Linen blend", icon: "leaf" },
    { title: "Breathable", detail: "All-day comfort", icon: "wind" },
    { title: "Relaxed fit", detail: "Easy through the shoulder", icon: "fit" },
  ],
  Dresses: [
    { title: "Soft drape", detail: "Stays in place", icon: "leaf" },
    { title: "Breathable", detail: "Warm-weather cloth", icon: "wind" },
    { title: "Easy belt", detail: "Adjusts as you move", icon: "fit" },
  ],
  default: [
    { title: "Considered cloth", detail: "Made to wear often", icon: "leaf" },
    { title: "Breathable", detail: "Ghana heat", icon: "wind" },
    { title: "Clean finish", detail: "Quiet details", icon: "fit" },
  ],
};

function HangerIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <circle cx="12" cy="5" r="1.6" />
      <path d="M12 7.2 4.5 13.5h15L12 7.2Z" strokeLinejoin="round" />
      <path d="M4.5 13.5h15" strokeLinecap="round" />
    </svg>
  );
}

export function AddToCart({
  product,
  isNew,
  sizeGuideNote,
  tryOnEnabled = true,
  signedIn = false,
}: {
  product: ProductWithVariants;
  isNew: boolean;
  shippingFeeGhs: number;
  sizeGuideNote: string;
  tryOnEnabled?: boolean;
  signedIn?: boolean;
}) {
  const variants = product.product_variants;
  const sizes = [...new Set(variants.map((item) => item.size))];
  const [size, setSize] = useState(sizes[0] ?? "");
  const colors = [...new Set(variants.filter((item) => item.size === size).map((item) => item.color))];
  const [color, setColor] = useState(colors[0] ?? "");
  const [guideOpen, setGuideOpen] = useState(false);
  const [tryOnOpen, setTryOnOpen] = useState(false);
  const [pop, setPop] = useState(0);
  const hydrated = useHydrated();
  const addItem = useCart((state) => state.addItem);
  const variant = useMemo(() => {
    const matches = variants.filter((item) => item.size === size && item.color === color);
    const pool = matches.length ? matches : variants.filter((item) => item.size === size);
    return pool.find((item) => item.stock > 0) ?? pool[0];
  }, [size, color, variants]);
  const price = variant ? variantPrice(product.base_price, variant.price_override) : product.base_price;
  const compareAt = variant?.price_override != null && product.base_price > price ? product.base_price : null;
  const inStock = (variant?.stock ?? 0) > 0;
  const inBag = useCart((state) => (variant ? state.items.some((item) => item.variantId === variant.id) : false));
  const added = hydrated && inBag;
  const notes = features[product.category] ?? features.default;
  const tagline = notes.map((note) => note.title).join(". ");

  function addToBag() {
    if (!variant || !inStock) return "unavailable" as const;
    if (added) return "already" as const;
    addItem({
      variantId: variant.id,
      productId: product.id,
      name: product.name,
      slug: product.slug,
      image: product.images[0] ?? null,
      size: variant.size,
      color: variant.color,
      unitPrice: price,
      compareAt,
    });
    setPop((count) => count + 1);
    toast.success("Added to bag", {
      description: `${product.name} · ${variant.size}, ${variant.color}`,
    });
    return "added" as const;
  }

  return (
    <div className="space-y-4">
      <div>
        {isNew ? <p className="text-[11px] tracking-[0.2em] text-rose uppercase">New arrival</p> : null}
        <h1 className="mt-1 font-heading text-[2rem] leading-tight tracking-tight text-pretty">{product.name}</h1>
        <OfferPrice price={price} compareAt={compareAt} className="mt-2" saleClassName="text-[1.65rem] leading-none text-rose" />
        <p className="mt-3 text-sm text-muted-foreground">{tagline}</p>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <p className="text-[11px] tracking-[0.18em] uppercase">Size</p>
          <button
            type="button"
            className="inline-flex min-h-11 items-center gap-1 text-xs text-muted-foreground"
            onClick={() => setGuideOpen((open) => !open)}
          >
            Size guide
            <CircleHelp className="size-3.5" />
          </button>
        </div>
        {guideOpen ? (
          <p className="mt-2 rounded-xl bg-muted px-3 py-2 text-sm text-muted-foreground">
            {sizeGuideNote}{" "}
            {variant ? `${variant.color} is the cloth for ${variant.size}.` : "Choose a size to see stock."}{" "}
            {inStock ? `${variant?.stock} in stock.` : "This size is out of stock."}
          </p>
        ) : null}
        <div className="mt-2 flex gap-2">
          {sizes.map((item) => {
            const selected = item === size;
            const available = variants.some((row) => row.size === item && row.stock > 0);
            return (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setSize(item);
                  const next = variants.find((row) => row.size === item);
                  if (next) setColor(next.color);
                }}
                className={`press-color h-12 flex-1 rounded-xl border text-sm ${
                  selected ? "border-transparent bg-primary text-primary-foreground" : "glass"
                } ${available ? "" : "opacity-40"}`}
              >
                {item}
              </button>
            );
          })}
        </div>
        {colors.length > 1 ? (
          <div className="mt-3 flex gap-2">
            {colors.map((item) => (
              <button
                key={item}
                type="button"
                aria-label={item}
                title={item}
                onClick={() => setColor(item)}
                className={`press size-11 rounded-full border ${item === color ? "border-primary" : "border-transparent"}`}
                style={{ backgroundColor: swatchColor(item) }}
              />
            ))}
          </div>
        ) : null}
      </div>

      {tryOnEnabled ? (
        signedIn ? (
          <button
            type="button"
            onClick={() => setTryOnOpen(true)}
            className="press cta-premium flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground"
          >
            <HangerIcon />
            Try it on
          </button>
        ) : (
          <Link
            href={`/login?next=${encodeURIComponent(`/product/${product.slug}`)}`}
            className="press cta-premium flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground"
          >
            <HangerIcon />
            Try it on
          </Link>
        )
      ) : (
        <p className="text-center text-sm text-muted-foreground">Virtual try-on is not available right now.</p>
      )}

      <button
        type="button"
        disabled={!inStock || !variant || added}
        aria-pressed={added}
        aria-live="polite"
        onClick={addToBag}
        className={`press cta-premium flex h-12 w-full items-center justify-center gap-2 rounded-full border border-foreground bg-foreground text-background ${added ? "" : "disabled:opacity-40"}`}
      >
        <ShoppingBag
          key={pop}
          className={`size-4 ${pop > 0 && added ? "heart-pop" : ""}`}
          fill={added ? "currentColor" : "none"}
          strokeWidth={1.75}
        />
        {added ? "Added" : "Add to bag"}
      </button>

      {signedIn ? (
        <TryOnPanel product={product} open={tryOnOpen} onOpenChange={setTryOnOpen} onAddToBag={addToBag} />
      ) : null}
    </div>
  );
}
