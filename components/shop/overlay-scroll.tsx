"use client";

import { useEffect } from "react";

export function OverlayScroll() {
  useEffect(() => {
    const timers = new WeakMap<EventTarget, number>();

    function mark(target: EventTarget | null) {
      const node =
        target instanceof HTMLElement
          ? target
          : document.scrollingElement instanceof HTMLElement
            ? document.scrollingElement
            : document.documentElement;
      node.setAttribute("data-scrolling", "");
      const previous = timers.get(node);
      if (previous) window.clearTimeout(previous);
      timers.set(
        node,
        window.setTimeout(() => {
          node.removeAttribute("data-scrolling");
          timers.delete(node);
        }, 700),
      );
    }

    function onScroll(event: Event) {
      mark(event.target);
    }

    document.addEventListener("scroll", onScroll, { capture: true, passive: true });
    return () => document.removeEventListener("scroll", onScroll, { capture: true });
  }, []);

  return null;
}
