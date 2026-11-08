"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useClientPathname } from "@/hooks/use-client-pathname";
import { useHydrated } from "@/hooks/use-hydrated";
import { useCart } from "@/store/cart";

export function FloatingCart() {
  const pathname = useClientPathname();
  const hydrated = useHydrated();
  const count = useCart((state) => state.items.reduce((sum, item) => sum + item.quantity, 0));
  const onCart = pathname === "/cart";

  if (!hydrated || count < 1 || onCart) return null;

  const label = count === 1 ? "1 item in cart" : `${count} items in cart`;

  return (
    <div className="cart-float fixed right-4 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-40 md:bottom-6">
      <Link href="/cart" aria-label={label} className="press cta-premium glass relative grid size-14 place-items-center rounded-full">
        <ShoppingBag className="size-5" strokeWidth={1.75} />
        <span className="absolute top-1.5 right-1.5 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] leading-4 text-primary-foreground">
          {count}
        </span>
      </Link>
    </div>
  );
}
