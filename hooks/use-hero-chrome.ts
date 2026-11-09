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
    if (!home) {
      document.documentElement.removeAttribute("data-hero-overlay");
      return;
    }
    function sync() {
      const hero = document.getElementById("home-hero");
      if (!hero) {
        setPastHero(false);
        document.documentElement.setAttribute("data-hero-overlay", "true");
        return;
      }
      const past = hero.getBoundingClientRect().bottom <= 80;
      setPastHero(past);
      if (past) document.documentElement.removeAttribute("data-hero-overlay");
      else document.documentElement.setAttribute("data-hero-overlay", "true");
    }
    sync();
    window.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => {
      window.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
      document.documentElement.removeAttribute("data-hero-overlay");
    };
  }, [home]);

  return { home, solid, overlay };
}
