"use client";

import { useRouter } from "next/navigation";
import { useRef, type MouseEvent, type ReactNode } from "react";

export function productPhotoName(slug: string) {
  return `product-${slug}`;
}

type ProductRouter = {
  push: (href: string) => void;
};

function reducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * The gallery name is not in the document when navigation starts, so a view
 * transition taken immediately has nothing to land on. Hold the new snapshot
 * until that gallery exists, and ignore a second transition React starts
 * while this one is already running.
 */
export function openProduct(router: ProductRouter, node: HTMLElement | null, slug: string) {
  const href = `/product/${slug}`;
  const name = productPhotoName(slug);
  if (node) {
    document.querySelectorAll<HTMLElement>("[data-product-photo]").forEach((element) => {
      element.style.viewTransitionName = element === node ? name : "none";
    });
    node.style.viewTransitionClass = "morph";
  }
  const go = () => router.push(href);
  const start = document.startViewTransition?.bind(document);
  if (!node || !start || reducedMotion()) {
    go();
    return;
  }

  const native = document.startViewTransition.bind(document);
  document.startViewTransition = ((update: unknown) => {
    const callback = typeof update === "function" ? update : (update as { update?: () => unknown }).update;
    const result = callback?.();
    return {
      finished: Promise.resolve(),
      ready: Promise.resolve(),
      updateCallbackDone: Promise.resolve(result),
      skipTransition: () => {},
    };
  }) as typeof document.startViewTransition;

  let transition: ViewTransition;
  try {
    transition = native(() => {
      go();
      return new Promise<void>((resolve) => {
        const begun = performance.now();
        const tick = () => {
          const landed = [...document.querySelectorAll<HTMLElement>("[data-product-destination]")].some(
            (element) => element.style.viewTransitionName === name
          );
          if (landed || performance.now() - begun > 2000) resolve();
          else requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    });
  } catch {
    document.startViewTransition = native;
    go();
    return;
  }
  transition.finished.finally(() => {
    document.startViewTransition = native;
  });
}

export function ProductPhoto({
  slug,
  className,
  children,
}: {
  slug: string;
  named?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  function followLink(event: MouseEvent<HTMLDivElement>) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (!event.currentTarget.closest("a")) return;
    event.preventDefault();
    openProduct(router, ref.current, slug);
  }

  return (
    <div ref={ref} data-product-photo="" data-slug={slug} className={className} onClick={followLink}>
      {children}
    </div>
  );
}
