"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function PageView() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    const timer = window.setTimeout(() => {
      const body = JSON.stringify({ path: pathname });
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/analytics", new Blob([body], { type: "application/json" }));
        return;
      }
      void fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  return null;
}
