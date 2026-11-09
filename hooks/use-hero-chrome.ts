"use client";

import { useEffect, useState } from "react";
import { useClientPathname } from "@/hooks/use-client-pathname";

export function useHeroChrome() {
  const pathname = useClientPathname();
  const home = pathname === null || pathname === "/";
  const [pastHero, setPastHero] = useState(false);
  const solid = !home || pastHero;
  const overlay = home && !pastHero;

  useEffect(() => {
    if (!home) return;
    function sync() {
      const hero = document.getElementById("home-hero");
      if (!hero) {
        setPastHero(false);
        return;
      }
      setPastHero(hero.getBoundingClientRect().bottom <= 80);
    }
    sync();
    window.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => {
      window.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, [home]);

  return { home, solid, overlay };
}
