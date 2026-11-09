"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useHydrated } from "@/hooks/use-hydrated";

export function ThemeToggle({ labelled = false, overlay = false }: { labelled?: boolean; overlay?: boolean }) {
  const { resolvedTheme, setTheme } = useTheme();
  const hydrated = useHydrated();
  const dark = hydrated && resolvedTheme === "dark";
  const label = dark ? "Switch to light mode" : "Switch to dark mode";

  return (
    <button
      type="button"
      aria-label={label}
      className={`press ${overlay && !labelled ? "text-white" : ""} ${labelled ? "glass flex h-12 w-full items-center justify-between rounded-2xl px-4 text-sm" : "grid size-11 place-items-center"}`}
      onClick={() => setTheme(dark ? "light" : "dark")}
    >
      {labelled ? <span>{dark ? "Light mode" : "Dark mode"}</span> : null}
      {dark ? <Sun className="size-5" strokeWidth={1.75} /> : <Moon className="size-5" strokeWidth={1.75} />}
    </button>
  );
}
