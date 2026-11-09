"use client";

import Link from "next/link";
import { useClientPathname } from "@/hooks/use-client-pathname";
import { useHeroChrome } from "@/hooks/use-hero-chrome";
import { Heart, House, ShoppingBag, UserRound } from "lucide-react";

const items = [
  { href: "/", label: "Home", icon: House },
  { href: "/products", label: "Shop", icon: ShoppingBag },
  { href: "/account/wishlist", label: "Wishlist", icon: Heart },
  { href: "/account", label: "Account", icon: UserRound },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/account") return pathname.startsWith("/account") && !pathname.startsWith("/account/wishlist");
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function BottomNav() {
  const pathname = useClientPathname();
  const { overlay } = useHeroChrome();

  return (
    <nav
      className={`fixed inset-x-0 bottom-0 z-40 pb-[env(safe-area-inset-bottom)] transition-[background-color,box-shadow,border-color] duration-300 ease-[var(--ease-out)] motion-reduce:transition-none md:hidden ${
        overlay ? "border-0 bg-transparent shadow-none" : "glass-chrome-bottom"
      }`}
    >
      <ul className="mx-auto grid max-w-lg grid-cols-4">
        {items.map((item) => {
          const active = pathname ? isActive(pathname, item.href) : false;
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`press relative flex min-h-14 flex-col items-center justify-center gap-1 text-[10px] tracking-[0.14em] uppercase ${
                  overlay
                    ? active
                      ? "font-medium text-white"
                      : "text-white/75"
                    : active
                      ? "font-medium text-olive"
                      : "text-muted-foreground"
                }`}
              >
                {active ? (
                  <span
                    aria-hidden
                    className={`absolute inset-x-2.5 top-2 bottom-2 -z-10 rounded-2xl ${
                      overlay ? "bg-white/18" : "bg-primary/12 dark:bg-primary/18"
                    }`}
                  />
                ) : null}
                <Icon className="size-5" strokeWidth={active ? 2 : 1.75} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
