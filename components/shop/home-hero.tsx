"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

const AUTO_MS = 8000;
const SWIPE_PX = 48;

export function HomeHero({ slides }: { slides: string[] }) {
  const count = slides.length;
  const [index, setIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const paused = useRef(false);

  const go = useCallback(
    (next: number) => {
      if (count === 0) return;
      setIndex(((next % count) + count) % count);
    },
    [count],
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (count <= 1 || reducedMotion) return;
    const id = window.setInterval(() => {
      if (paused.current) return;
      setIndex((current) => (current + 1) % count);
    }, AUTO_MS);
    return () => window.clearInterval(id);
  }, [count, reducedMotion]);

  function onTouchStart(event: React.TouchEvent) {
    touchStartX.current = event.touches[0]?.clientX ?? null;
    paused.current = true;
  }

  function onTouchEnd(event: React.TouchEvent) {
    const start = touchStartX.current;
    touchStartX.current = null;
    window.setTimeout(() => {
      paused.current = false;
    }, AUTO_MS);
    if (start === null || count <= 1) return;
    const endX = event.changedTouches[0]?.clientX;
    if (endX === undefined) return;
    const delta = endX - start;
    if (Math.abs(delta) < SWIPE_PX) return;
    if (delta < 0) go(index + 1);
    else go(index - 1);
  }

  return (
    <section
      id="home-hero"
      className="home-hero relative -mx-4 -mt-4 overflow-hidden sm:mx-0 sm:mt-0 sm:rounded-3xl"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      aria-roledescription="carousel"
      aria-label="Featured looks"
    >
      <div className="relative flex h-[100svh] max-h-[52rem] min-h-[22rem] items-center justify-center bg-muted sm:h-[min(54svh,40rem)] sm:max-h-none sm:min-h-80">
        {count > 0 ? (
          <div className="absolute inset-0" aria-live="polite">
            {slides.map((src, i) => {
              const active = i === index;
              return (
                <div
                  key={src}
                  className={`absolute inset-0 transition-opacity duration-700 ease-[var(--ease-out)] motion-reduce:transition-none ${
                    active ? "z-[1] opacity-100" : "z-0 opacity-0"
                  }`}
                  aria-hidden={!active}
                >
                  <div
                    key={active ? `zoom-${index}-${i}` : `idle-${i}`}
                    className={`home-hero-media absolute inset-0${active && !reducedMotion ? " home-hero-media--active" : ""}`}
                  >
                    <Image
                      src={src}
                      alt=""
                      fill
                      priority={i === 0}
                      loading={i === 0 ? "eager" : "lazy"}
                      className="object-cover object-center"
                      sizes="(max-width: 768px) 100vw, 1152px"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
        <div
          className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-b from-black/30 via-black/40 to-black/65 sm:from-black/25 sm:via-black/35 sm:to-black/55"
          aria-hidden
        />
        <div className="relative z-10 mx-auto max-w-md px-6 text-center text-white sm:max-w-xl sm:px-8">
          <p className="text-[10px] tracking-[0.2em] text-white/80 uppercase sm:text-[11px]">New collection</p>
          <h1 className="mt-3 font-heading text-[1.875rem] leading-[1.2] tracking-tight text-pretty sm:mt-2 sm:text-5xl sm:leading-[0.95]">
            Elevated essentials
          </h1>
          <p className="mt-3 text-base leading-relaxed text-pretty text-white/88 sm:mt-3 sm:text-sm sm:text-white/85">
            Timeless pieces. Modern silhouettes. Made for the way you live.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:mt-5 sm:flex-row sm:justify-center">
            <Link
              href="/products"
              className="press inline-flex h-11 min-w-[10.5rem] items-center justify-center rounded-sm bg-white px-5 text-[17px] font-medium text-foreground sm:h-12 sm:rounded-full sm:text-sm"
            >
              Shop the collection
            </Link>
            <Link
              href="/?tab=new"
              className="press inline-flex h-11 min-w-[10.5rem] items-center justify-center rounded-sm border border-white/55 bg-white/10 px-5 text-[17px] font-medium text-white backdrop-blur-sm sm:h-12 sm:rounded-full sm:text-sm"
            >
              New arrivals
            </Link>
          </div>
        </div>
        {count > 1 ? (
          <div
            className="absolute inset-x-0 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-10 flex justify-center gap-2 sm:bottom-[max(1.25rem,env(safe-area-inset-bottom))]"
            role="tablist"
            aria-label="Hero slides"
          >
            {slides.map((src, i) => (
              <button
                key={src}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Slide ${i + 1} of ${count}`}
                className={`press h-2.5 rounded-full border border-white/55 transition-[width,background-color] duration-300 ease-[var(--ease-out)] motion-reduce:transition-none ${
                  i === index ? "w-7 bg-white" : "w-2.5 bg-white/25"
                }`}
                onClick={(event) => {
                  event.preventDefault();
                  go(i);
                }}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
