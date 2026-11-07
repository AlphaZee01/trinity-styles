"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function useClientPathname() {
  const pathname = usePathname();
  const [current, setCurrent] = useState<string | null>(null);

  useEffect(() => {
    setCurrent(pathname);
  }, [pathname]);

  return current;
}
