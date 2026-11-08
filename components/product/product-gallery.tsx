"use client";

import { useRef, useState, type UIEvent } from "react";
import Image from "next/image";
import { WishlistButton } from "@/components/product/wishlist-button";

export function ProductGallery({
  images,
  name,
  productId,
}: {
  images: string[];
  name: string;
  productId: string;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  function onScroll(event: UIEvent<HTMLDivElement>) {
    const el = event.currentTarget;
    if (!el.clientWidth) return;
    const next = Math.round(el.scrollLeft / el.clientWidth);
    setIndex((current) => (current === next ? current : next));
  }

  function show(next: number) {
    const el = scroller.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ left: next * el.clientWidth, behavior: reduce ? "auto" : "smooth" });
  }

  return (
    <div>
      <div className="relative">
        <div
          ref={scroller}
          onScroll={onScroll}
          className="glass flex aspect-[3/4] w-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain rounded-3xl bg-muted [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {images.map((src, itemIndex) => (
            <div key={src} className="relative h-full min-w-full shrink-0 snap-center">
              <Image
                src={src}
                alt={`${name}, photo ${itemIndex + 1}`}
                fill
                priority={itemIndex === 0}
                loading={itemIndex === 0 ? "eager" : "lazy"}
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 448px"
              />
            </div>
          ))}
        </div>
        <WishlistButton productId={productId} productName={name} appearance="float" />
      </div>
      {images.length > 1 ? (
        <div className="mt-3 flex gap-2">
          {images.map((src, itemIndex) => (
            <button
              key={src}
              type="button"
              aria-label={`Photo ${itemIndex + 1}`}
              aria-current={itemIndex === index ? "true" : undefined}
              onClick={() => show(itemIndex)}
              className={`press relative h-16 w-12 overflow-hidden rounded-xl bg-muted ${
                itemIndex === index ? "ring-2 ring-foreground" : "opacity-70"
              }`}
            >
              <Image src={src} alt="" fill sizes="48px" className="object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
