"use client";

import Link from "next/link";
import { useClientPathname } from "@/hooks/use-client-pathname";
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

  return (
    <nav className="glass-chrome fixed inset-x-0 bottom-0 z-40 border-t-0 pb-[env(safe-area-inset-bottom)] md:hidden">
      <ul className="mx-auto grid max-w-lg grid-cols-4">
        {items.map((item) => {
          const active = pathname ? isActive(pathname, item.href) : false;
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`press flex min-h-14 flex-col items-center justify-center gap-1 text-[10px] tracking-[0.14em] uppercase ${
                  active ? "text-olive" : "text-muted-foreground"
                }`}
              >
                <Icon className="size-5" strokeWidth={1.75} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
