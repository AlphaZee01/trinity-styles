"use client";

import { useEffect, useState } from "react";
import { ProductCard } from "@/components/product/product-card";
import { EmptyState } from "@/components/states";
import type { ProductWithVariants } from "@/lib/types";

const pageSize = 4;

export function ProductFeed({
  products,
  newIds = [],
}: {
  products: ProductWithVariants[];
  newIds?: string[];
}) {
  const [count, setCount] = useState(() => Math.min(pageSize, products.length));
  const fresh = new Set(newIds);
  const done = count >= products.length;

  useEffect(() => {
    if (done) return;
    const node = document.getElementById("product-feed-more");
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        setCount((current) => Math.min(products.length, current + pageSize));
      },
      { rootMargin: "320px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [done, products.length, count]);

  if (products.length === 0) {
    return <EmptyState title="No pieces yet" description="Products in this collection will show here." />;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {products.slice(0, count).map((product) => (
          <ProductCard key={product.id} product={product} showNew={fresh.has(product.id)} />
        ))}
      </div>
      {done ? null : (
        <div id="product-feed-more" className="h-16" aria-hidden />
      )}
    </div>
  );
}
