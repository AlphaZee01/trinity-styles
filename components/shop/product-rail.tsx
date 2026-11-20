"use client";

import Image from "next/image";
import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";
import { OfferPrice } from "@/components/product/offer-price";
import { ProductPhoto } from "@/components/product/product-photo";
import type { OrbitProduct } from "@/components/shop/product-orbit";
import { EmptyState } from "@/components/states";

// Layout, in CSS px. The rail climbs SIDE_RISE px by the screen edges, so cards slide in
// from the sides along a curve. Cards sit BASE px above the bottom of the stage.
const SIDE_RISE = 64;
const SPACING = 1.55; // distance between neighbours, as a share of card width
const BASE = 20;

const mod = (a: number, n: number) => ((a % n) + n) % n;

type Rail = {
  offset: number;
  vel: number;
  target: number | null;
  dragging: boolean;
  moved: boolean;
  startX: number;
  lastX: number;
  wheelUntil: number;
  width: number;
  cardW: number;
  spacing: number;
  k: number;
  active: number;
  reduced: boolean;
};

export function ProductRail({ products, newIds = [] }: { products: OrbitProduct[]; newIds?: string[] }) {
  const count = products.length;
  const stageRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const rail = useRef<Rail>({
    offset: 0,
    vel: 0,
    target: null,
    dragging: false,
    moved: false,
    startX: 0,
    lastX: 0,
    wheelUntil: 0,
    width: 0,
    cardW: 144,
    spacing: 223,
    k: 0,
    active: 0,
    reduced: false,
  });
  // Small catalogs are repeated until the loop is longer than the screen. copies * count slots.
  const [copies, setCopies] = useState(() => Math.max(1, Math.ceil(10 / Math.max(count, 1))));
  const [active, setActive] = useState(0);
  const slotCount = count < 2 ? count : count * copies;

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage || count < 2) return;
    const s = rail.current;
    const slots = count * copies;
    let raf = 0;

    const snapOffset = () => Math.round(s.offset / s.spacing) * s.spacing;

    // Every frame: slot position -> x, curve height, tilt and depth, baked into one matrix().
    const render = () => {
      const loop = slots * s.spacing;
      const reach = s.width / 2 + s.cardW;
      let best = Infinity;
      let bestSlot = 0;
      for (let j = 0; j < slots; j++) {
        const el = itemRefs.current[j];
        if (!el) continue;
        const pos = mod(j * s.spacing + s.offset + loop / 2, loop) - loop / 2;
        const dist = Math.abs(pos);
        if (dist < best) {
          best = dist;
          bestSlot = j;
        }
        if (dist > reach) {
          el.style.visibility = "hidden";
          continue;
        }
        el.style.visibility = "visible";
        const near = Math.min(1, dist / (s.spacing * 2));
        const scale = 0.78 + 0.28 * (1 - near);
        const theta = Math.atan(-2 * s.k * pos) * 0.6;
        const cos = Math.cos(theta) * scale;
        const sin = Math.sin(theta) * scale;
        el.style.transform = `matrix(${cos.toFixed(4)}, ${sin.toFixed(4)}, ${(-sin).toFixed(4)}, ${cos.toFixed(4)}, ${pos.toFixed(2)}, ${(-s.k * pos * pos).toFixed(2)})`;
        el.style.opacity = (1 - 0.6 * near).toFixed(3);
        el.style.zIndex = String(Math.max(0, 100 - Math.round(dist / 6)));
      }
      if (bestSlot !== s.active) {
        s.active = bestSlot;
        setActive(bestSlot);
      }
    };

    const tick = () => {
      raf = 0;
      if (!s.dragging) {
        if (performance.now() < s.wheelUntil) {
          // trackpad scrolling in progress: do not snap yet
        } else if (s.target !== null) {
          s.offset += (s.target - s.offset) * (s.reduced ? 1 : 0.14);
          if (Math.abs(s.target - s.offset) < 0.3) {
            s.offset = s.target;
            s.target = null;
          }
        } else if (Math.abs(s.vel) > 0.4) {
          s.offset += s.vel;
          s.vel *= 0.95;
        } else {
          s.vel = 0;
          const snap = snapOffset();
          s.offset += (snap - s.offset) * 0.14;
          if (Math.abs(snap - s.offset) < 0.3) s.offset = snap;
        }
      }
      render();
      const resting =
        !s.dragging && s.target === null && s.vel === 0 && performance.now() >= s.wheelUntil && s.offset === snapOffset();
      if (!resting) start();
    };

    function start() {
      if (!raf) raf = requestAnimationFrame(tick);
    }

    const step = (dir: number) => {
      s.target = snapOffset() - dir * s.spacing;
      s.vel = 0;
      start();
    };

    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      s.dragging = true;
      s.moved = false;
      s.startX = s.lastX = e.clientX;
      s.target = null;
      s.vel = 0;
      start();
    };
    const onMove = (e: PointerEvent) => {
      if (!s.dragging) return;
      if (!s.moved && Math.abs(e.clientX - s.startX) > 6) {
        s.moved = true;
        stage.setPointerCapture(e.pointerId);
        stage.dataset.dragging = "true";
      }
      if (!s.moved) return;
      const dx = e.clientX - s.lastX;
      s.lastX = e.clientX;
      s.offset += dx; // the rail follows the finger
      s.vel = Math.max(-60, Math.min(60, s.vel * 0.5 + dx * 0.5));
    };
    const onUp = () => {
      if (!s.dragging) return;
      s.dragging = false;
      delete stage.dataset.dragging;
      if (s.reduced) {
        s.vel = 0;
        s.target = snapOffset();
      }
      start();
    };
    const onClick = (e: MouseEvent) => {
      if (!s.moved) return;
      e.preventDefault();
      e.stopPropagation();
      s.moved = false;
    };
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      s.offset -= e.deltaX;
      s.vel = 0;
      s.target = null;
      s.wheelUntil = performance.now() + 140;
      start();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
    };

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotion = () => {
      s.reduced = mq.matches;
    };
    syncMotion();
    mq.addEventListener("change", syncMotion);

    const measure = () => {
      s.width = stage.clientWidth;
      s.cardW = itemRefs.current[0]?.offsetWidth || 144;
      s.spacing = s.cardW * SPACING;
      s.k = SIDE_RISE / (s.width / 2) ** 2;
      const needed = Math.ceil((s.width + s.cardW * 2) / s.spacing) + 2;
      const nextCopies = Math.max(1, Math.ceil(needed / count));
      if (nextCopies !== copies) {
        setCopies(nextCopies);
        return;
      }
      render();
    };
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    measure();

    stage.addEventListener("pointerdown", onDown);
    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("pointerup", onUp);
    stage.addEventListener("pointercancel", onUp);
    stage.addEventListener("click", onClick, true);
    stage.addEventListener("wheel", onWheel, { passive: false });
    stage.addEventListener("keydown", onKey);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      observer.disconnect();
      mq.removeEventListener("change", syncMotion);
      stage.removeEventListener("pointerdown", onDown);
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerup", onUp);
      stage.removeEventListener("pointercancel", onUp);
      stage.removeEventListener("click", onClick, true);
      stage.removeEventListener("wheel", onWheel);
      stage.removeEventListener("keydown", onKey);
    };
  }, [count, copies]);

  if (count === 0) {
    return <EmptyState title="No pieces yet" description="Products in this collection will show here." />;
  }

  const slots = count < 2 ? products : Array.from({ length: slotCount }, (_, j) => products[j % count]);
  const current = slots[Math.min(active, slots.length - 1)];
  const fresh = new Set(newIds);

  return (
    <div>
      <div
        ref={stageRef}
        role="group"
        aria-roledescription="carousel"
        aria-label="All products. Swipe sideways to browse. The rail loops."
        tabIndex={count > 1 ? 0 : -1}
        className="relative -mx-4 h-[19.5rem] cursor-grab touch-pan-y overflow-hidden outline-none select-none [--w:9rem] focus-visible:ring-2 focus-visible:ring-primary/50 data-[dragging=true]:cursor-grabbing sm:mx-0 sm:h-[23rem] sm:rounded-3xl sm:[--w:11rem]"
      >
        {slots.map((product, j) => (
          <Link
            key={`${product.id}-${j}`}
            ref={(el) => {
              itemRefs.current[j] = el;
            }}
            href={`/product/${product.slug}`}
            draggable={false}
            tabIndex={j === active ? 0 : -1}
            aria-label={product.name}
            className={`absolute left-1/2 block origin-bottom will-change-transform ${count < 2 ? "" : "invisible"}`}
            style={{ bottom: BASE, width: "var(--w)", marginLeft: "calc(var(--w) / -2)" }}
          >
            <ProductPhoto slug={product.slug} className="glass relative aspect-[3/4] overflow-hidden rounded-2xl bg-muted">
                {product.image ? (
                  <Image src={product.image} alt="" fill draggable={false} sizes="(max-width: 640px) 144px, 176px" className="object-cover" />
                ) : (
                  <div className="grid h-full place-items-center text-xs text-muted-foreground">No image</div>
                )}
                {fresh.has(product.id) ? (
                  <span className="absolute top-2 left-2 rounded-full bg-background/90 px-2 py-1 text-[10px] tracking-[0.14em] uppercase">
                    New
                  </span>
                ) : null}
            </ProductPhoto>
          </Link>
        ))}
      </div>

      <div className="mt-2 text-center" aria-live="polite">
        <h3 className="font-heading text-2xl leading-tight tracking-tight text-pretty">{current.name}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{current.category}</p>
        <OfferPrice price={current.price} compareAt={current.compareAt} className="mt-1 justify-center" saleClassName="text-primary" />
      </div>
    </div>
  );
}
