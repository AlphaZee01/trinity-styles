"use client";

import Image from "next/image";
import Link from "next/link";
import { BarChart3, ChevronLeft, LayoutGrid, Shirt, ShoppingBag, Sparkles, Users } from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { useClientPathname } from "@/hooks/use-client-pathname";

const nav = [
  { href: "/admin", label: "Dashboard", icon: LayoutGrid },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/products", label: "Products", icon: Shirt },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
  { href: "/admin/settings/try-on", label: "Try-on AI", icon: Sparkles },
];

function backHref(pathname: string | null) {
  if (!pathname) return null;
  if (pathname.startsWith("/admin/products/")) return "/admin/products";
  if (pathname.startsWith("/admin/customers/")) return "/admin/customers";
  if (pathname.startsWith("/admin/orders/")) return "/admin/orders";
  if (pathname.startsWith("/admin/settings/")) return "/admin";
  return null;
}

function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function Mark() {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <span className="relative h-12 w-11 shrink-0 overflow-hidden">
        <Image
          src="/logo.png"
          alt=""
          width={779}
          height={841}
          className="absolute top-0 left-1/2 h-[128%] w-auto max-w-none -translate-x-1/2"
        />
      </span>
      <span className="min-w-0 text-left leading-none">
        <span className="block truncate font-heading text-[13px] tracking-[0.16em]">TRINITY STYLES</span>
        <span className="mt-1 block text-[9px] tracking-[0.22em] text-muted-foreground">ADMIN</span>
      </span>
    </span>
  );
}

export function AdminShell({ children, name }: { children: React.ReactNode; name: string }) {
  const pathname = useClientPathname();
  const back = backHref(pathname);

  return (
    <div className="min-h-dvh bg-background md:flex">
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-border bg-background md:flex">
        <div className="px-5 py-6">
          <Mark />
          <p className="mt-4 truncate text-sm">{name}</p>
          <Link href="/" className="press mt-2 inline-flex h-11 items-center text-sm text-muted-foreground">
            View shop
          </Link>
          <div className="mt-2">
            <ThemeToggle labelled />
          </div>
        </div>
        <nav className="flex flex-col gap-1 px-3">
          {nav.map((item) => {
            const on = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`press flex h-11 items-center gap-2 rounded-xl px-3 text-sm ${on ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}
              >
                <Icon className="size-4" strokeWidth={1.75} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="glass-chrome sticky top-0 z-40 flex items-center justify-between px-4 pt-[env(safe-area-inset-top)] md:hidden">
          <Link href="/admin" className="flex min-w-0 py-3" aria-label="Admin home">
            <Mark />
          </Link>
          <ThemeToggle />
        </header>
        <div className="flex-1 px-4 py-6 pb-28 md:px-8 md:py-8">
          {back ? (
            <Link href={back} className="press glass mb-4 inline-flex h-11 items-center gap-1 rounded-full px-4 text-sm">
              <ChevronLeft className="size-4" strokeWidth={1.75} />
              Back
            </Link>
          ) : null}
          {children}
        </div>
      </div>
      <nav className="glass-chrome fixed inset-x-0 bottom-0 z-40 pb-[env(safe-area-inset-bottom)] md:hidden">
        <ul className="grid grid-cols-6">
          {nav.map((item) => {
            const Icon = item.icon;
            const on = isActive(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`press flex min-h-14 flex-col items-center justify-center gap-1 px-1 text-[10px] ${on ? "text-primary" : "text-muted-foreground"}`}
                >
                  <Icon className="size-5" strokeWidth={1.75} />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
