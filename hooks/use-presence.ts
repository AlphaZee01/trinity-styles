"use client";

import { useEffect, useState } from "react";

export function usePresence(open: boolean, duration = 180) {
  const [present, setPresent] = useState(open);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!open) {
      setShown(false);
      const id = window.setTimeout(() => setPresent(false), duration);
      return () => window.clearTimeout(id);
    }

    setPresent(true);
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setShown(true));
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [open, duration]);

  return { present, shown };
}
