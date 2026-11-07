"use client";

import { useEffect } from "react";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";

function ThemeColor() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const color = resolvedTheme === "dark" ? "#12182a" : "#eef3fb";
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", color);
  }, [resolvedTheme]);

  return null;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem storageKey="trinity-styles-theme">
      <ThemeColor />
      {children}
    </NextThemesProvider>
  );
}
