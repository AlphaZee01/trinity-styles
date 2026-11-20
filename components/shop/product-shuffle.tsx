"use client";

import { Shuffle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { OfferPrice } from "@/components/product/offer-price";
import type { OrbitProduct } from "@/components/shop/product-orbit";

// Fisher-Yates: returns a new array in random order.
function shuffle<T>(items: T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

export function ProductShuffle({ products }: { products: OrbitProduct[] }) {
  const [order, setOrder] = useState(products);
  const [shuffles, setShuffles] = useState(0);

  if (products.length === 0) return null;

  function reshuffle() {
    let next = shuffle(order);
    // With 2 or more items, never hand back the same order.
    for (let tries = 0; order.length > 1 && tries < 5 && next.every((p, i) => p.id === order[i].id); tries++) {
      next = shuffle(order);
    }
    setOrder(next);
    setShuffles((n) => n + 1);
  }

  return (
    <section aria-label="Shuffle grid">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-2xl tracking-tight">Collection</h2>
        <button
          type="button"
          onClick={reshuffle}
          className="press cta-premium inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground"
        >
          <Shuffle className="size-4" strokeWidth={1.75} />
          Shuffle
        </button>
      </div>
      <p className="sr-only" aria-live="polite">
        {shuffles > 0 ? "Products shuffled" : ""}
      </p>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {order.map((product) => (
          <Link key={product.id} href={`/product/${product.slug}`} className="press group block min-w-0">
            <div className="glass relative aspect-[3/4] overflow-hidden rounded-2xl bg-muted">
              {product.image ? (
                <Image src={product.image} alt="" fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover" />
              ) : (
                <div className="grid h-full place-items-center text-sm text-muted-foreground">No image</div>
              )}
            </div>
            <h3 className="mt-3 font-heading text-lg leading-tight tracking-tight text-pretty">{product.name}</h3>
            <OfferPrice price={product.price} compareAt={product.compareAt} saleClassName="text-sm" />
          </Link>
        ))}
      </div>
    </section>
  );
}
