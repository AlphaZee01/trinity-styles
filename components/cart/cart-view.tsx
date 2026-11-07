"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/states";
import { Skeleton } from "@/components/ui/skeleton";
import { formatGhs } from "@/lib/format";
import { OfferPrice } from "@/components/product/offer-price";
import { useHydrated } from "@/hooks/use-hydrated";
import { useCart } from "@/store/cart";

function QuantityField({
  quantity,
  onCommit,
}: {
  quantity: number;
  onCommit: (quantity: number) => void;
}) {
  const [draft, setDraft] = useState(String(quantity));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setDraft(String(quantity));
  }, [focused, quantity]);

  function commit(value: string) {
    const next = Number(value);
    if (/^\d+$/.test(value) && next >= 1) {
      onCommit(next);
      setDraft(String(next));
      return;
    }
    setDraft(String(quantity));
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      aria-label="Quantity"
      value={draft}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false);
        commit(draft);
      }}
      onChange={(event) => {
        const value = event.target.value;
        if (value !== "" && !/^\d+$/.test(value)) return;
        setDraft(value);
        const next = Number(value);
        if (value !== "" && next >= 1) onCommit(next);
      }}
      className="h-10 w-16 rounded-lg border border-border bg-background px-2 text-base"
    />
  );
}

export function CartView() {
  const hydrated = useHydrated();
  const items = useCart((state) => state.items);
  const setQuantity = useCart((state) => state.setQuantity);
  const removeItem = useCart((state) => state.removeItem);
  const total = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  if (!hydrated) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="Your bag is empty"
        description="Browse the collection and add a size when you are ready. Saved pieces live in your wishlist."
      />
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
      <ul className="space-y-4">
        {items.map((item) => (
          <li key={item.variantId} className="glass flex gap-4 rounded-2xl p-3">
            <div className="relative size-24 overflow-hidden rounded-lg bg-muted">
              {item.image ? (
                <Image src={item.image} alt={item.name} fill sizes="96px" className="object-cover" />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <Link href={`/product/${item.slug}`} className="font-heading text-lg tracking-tight">
                {item.name}
              </Link>
              <p className="text-sm text-muted-foreground">
                {item.size} · {item.color}
              </p>
              <OfferPrice price={item.unitPrice} compareAt={item.compareAt} className="mt-1" saleClassName="text-sm" />
              <div className="mt-3 flex items-center gap-2">
                <QuantityField quantity={item.quantity} onCommit={(quantity) => setQuantity(item.variantId, quantity)} />
                <button
                  type="button"
                  className="text-sm text-muted-foreground"
                  onClick={() => removeItem(item.variantId)}
                >
                  Remove
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <aside className="glass h-fit rounded-2xl p-5">
        <p className="text-sm text-muted-foreground">Subtotal</p>
        <p className="mt-1 font-heading text-3xl tracking-tight">{formatGhs(total)}</p>
        <Button className="mt-5 h-11 w-full" nativeButton={false} render={<Link href="/checkout" />}>
          Checkout
        </Button>
      </aside>
    </div>
  );
}
