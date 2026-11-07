"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/store/cart";

export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    void useCart.persist.rehydrate();
    setHydrated(true);
  }, []);
  return hydrated;
}
