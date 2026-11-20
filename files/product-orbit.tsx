"use client";

import Image from "next/image";
import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";
import { OfferPrice } from "@/components/product/offer-price";

export type OrbitProduct = {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  price: number;
  compareAt: number | null;
  category: string;
};

const TAU = Math.PI * 2;
const FRONT = Math.PI / 2;
const DRAG_PX = 6;
const MAX_DOTS = 8;

const mod = (a: number, n: number) => ((a % n) + n) % n;

type Wheel = {
  rot: number;
  vel: number;
  target: number | null;
  dragging: boolean;
  moved: boolean;
  startX: number;
  lastX: number;
  radius: number;
  active: number;
  reduced: boolean;
};

export function ProductOrbit({ products }: { products: OrbitProduct[] }) {
  const count = products.length;
  const stageRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const goToRef = useRef<(index: number) => void>(() => {});
  const wheel = useRef<Wheel>({
    rot: FRONT,
    vel: 0,
    target: null,
    dragging: false,
    moved: false,
    startX: 0,
    lastX: 0,
    radius: 240,
    active: 0,
    reduced: false,
  });
  const [active, setActive] = useState(0);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage || count < 2) return;
    const s = wheel.current;
    const step = TAU / count;
    let raf = 0;

    const snapAngle = () => FRONT + Math.round((s.rot - FRONT) / step) * step;

    // Every frame: each product's angle becomes cos/sin, then one matrix(a, b, c, d, tx, ty).
    // a = d = depth scale, b = c = 0, tx = radius * cos, ty = ellipse height * sin.
    const render = () => {
      const ry = Math.max(36, s.radius * 0.26);
      for (let i = 0; i < count; i++) {
        const el = itemRefs.current[i];
        if (!el) continue;
        const theta = s.rot + i * step;
        const cos = Math.cos(theta);
        const sin = Math.sin(theta);
        const depth = (sin + 1) / 2;
        const k = 0.5 + 0.5 * depth;
        el.style.transform = `matrix(${k.toFixed(4)}, 0, 0, ${k.toFixed(4)}, ${(s.radius * cos).toFixed(2)}, ${(ry * sin - 8).toFixed(2)})`;
        el.style.zIndex = String(Math.round(depth * 100));
        el.style.opacity = (0.4 + 0.6 * depth).toFixed(3);
      }
      const front = mod(-Math.round((s.rot - FRONT) / step), count);
      if (front !== s.active) {
        s.active = front;
        setActive(front);
      }
    };

    const tick = () => {
      raf = 0;
      if (!s.dragging) {
        if (s.target !== null) {
          s.rot += (s.target - s.rot) * (s.reduced ? 1 : 0.14);
          if (Math.abs(s.target - s.rot) < 0.0004) {
            s.rot = s.target;
            s.target = null;
          }
        } else if (Math.abs(s.vel) > 0.0008) {
          s.rot += s.vel;
          s.vel *= 0.94;
        } else {
          s.vel = 0;
          const snap = snapAngle();
          s.rot += (snap - s.rot) * 0.12;
          if (Math.abs(snap - s.rot) < 0.0004) s.rot = snap;
        }
      }
      render();
      const resting = !s.dragging && s.target === null && s.vel === 0 && Math.abs(snapAngle() - s.rot) < 1e-9;
      if (!resting) start();
    };

    function start() {
      if (!raf) raf = requestAnimationFrame(tick);
    }

    const goTo = (index: number) => {
      const k = Math.round((s.rot - FRONT) / step);
      let diff = index - mod(-k, count);
      if (diff > count / 2) diff -= count;
      if (diff < -count / 2) diff += count;
      s.target = FRONT + (k - diff) * step;
      s.vel = 0;
      start();
    };
    goToRef.current = goTo;

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
      if (!s.moved && Math.abs(e.clientX - s.startX) > DRAG_PX) {
        s.moved = true;
        stage.setPointerCapture(e.pointerId);
        stage.dataset.dragging = "true";
      }
      if (!s.moved) return;
      // The front item follows the pointer, so the rotation runs against the drag direction.
      const d = (e.clientX - s.lastX) / s.radius;
      s.lastX = e.clientX;
      s.rot -= d;
      s.vel = s.vel * 0.5 - d * 0.5;
    };
    const onUp = () => {
      if (!s.dragging) return;
      s.dragging = false;
      delete stage.dataset.dragging;
      if (s.reduced) {
        s.vel = 0;
        s.target = snapAngle();
      }
      start();
    };
    const onClick = (e: MouseEvent) => {
      if (s.moved) {
        e.preventDefault();
        e.stopPropagation();
        s.moved = false;
        return;
      }
      const link = (e.target as Element).closest<HTMLElement>("[data-index]");
      if (!link) return;
      const index = Number(link.dataset.index);
      if (index !== s.active) {
        e.preventDefault();
        goTo(index);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goTo(mod(s.active - 1, count));
      else if (e.key === "ArrowLeft") goTo(mod(s.active + 1, count));
    };

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotion = () => {
      s.reduced = mq.matches;
    };
    syncMotion();
    mq.addEventListener("change", syncMotion);

    const measure = () => {
      s.radius = Math.min(300, stage.clientWidth * 0.36);
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
      stage.removeEventListener("keydown", onKey);
    };
  }, [count]);

  if (count === 0) return null;
  const current = products[Math.min(active, count - 1)];

  return (
    <section aria-label="Collection wheel">
      <div className="mb-4 flex items-end justify-between gap-3">
        <h2 className="font-heading text-2xl tracking-tight">Collection</h2>
        <Link href="/products" className="text-xs tracking-[0.14em] text-muted-foreground uppercase">
          View all
        </Link>
      </div>

      <div className="glass overflow-hidden rounded-3xl pt-2 pb-5">
        <div
          ref={stageRef}
          role="group"
          aria-roledescription="carousel"
          aria-label="Products. Drag sideways or use the left and right arrow keys."
          tabIndex={count > 1 ? 0 : -1}
          className="relative h-[21rem] cursor-grab touch-pan-y select-none outline-none [--w:8.5rem] focus-visible:ring-2 focus-visible:ring-primary/50 data-[dragging=true]:cursor-grabbing sm:h-[25rem] sm:[--w:11rem]"
        >
          {products.map((product, i) => (
            <Link
              key={product.id}
              ref={(el) => {
                itemRefs.current[i] = el;
              }}
              href={`/product/${product.slug}`}
              data-index={i}
              draggable={false}
              tabIndex={i === active ? 0 : -1}
              aria-label={product.name}
              className="absolute top-1/2 left-1/2 block will-change-transform"
              style={{ width: "var(--w)", marginLeft: "calc(var(--w) / -2)", marginTop: "calc(var(--w) * -0.6667)" }}
            >
              <div className="glass relative aspect-[3/4] overflow-hidden rounded-2xl bg-muted">
                {product.image ? (
                  <Image
                    src={product.image}
                    alt=""
                    fill
                    draggable={false}
                    sizes="(max-width: 640px) 136px, 176px"
                    className="object-cover"
                  />
                ) : (
                  <div className="grid h-full place-items-center text-sm text-muted-foreground">No image</div>
                )}
              </div>
            </Link>
          ))}
        </div>

        <div className="px-4 text-center" aria-live="polite">
          <h3 className="font-heading text-2xl leading-tight tracking-tight text-pretty">{current.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{current.category}</p>
          <OfferPrice price={current.price} compareAt={current.compareAt} className="mt-1 justify-center" saleClassName="text-primary" />
          <Link
            href={`/product/${current.slug}`}
            className="press cta-premium mt-3 inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground"
          >
            View product
          </Link>
        </div>

        {count > 1 ? (
          count <= MAX_DOTS ? (
            <div className="mt-2 flex justify-center">
              {products.map((product, i) => (
                <button
                  key={product.id}
                  type="button"
                  aria-label={`Show ${product.name}`}
                  aria-current={i === active}
                  onClick={() => goToRef.current(i)}
                  className="grid h-11 w-8 place-items-center"
                >
                  <span
                    className={`h-2 rounded-full transition-[width,background-color] duration-300 ease-[var(--ease-out)] motion-reduce:transition-none ${
                      i === active ? "w-5 bg-primary" : "w-2 bg-foreground/20"
                    }`}
                  />
                </button>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-center text-xs tracking-[0.14em] text-muted-foreground">
              {active + 1} / {count}
            </p>
          )
        ) : null}
      </div>
    </section>
  );
}
