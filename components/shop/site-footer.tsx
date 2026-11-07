import Image from "next/image";
import Link from "next/link";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { getAuthContext } from "@/lib/auth";

export async function SiteFooter() {
  const { userId, profile } = await getAuthContext();
  const signedIn = Boolean(userId);
  const accountLabel = profile?.full_name?.trim() || "Account";
  const links = signedIn
    ? [
        { href: "/products", label: "Shop" },
        { href: "/account/orders", label: "Orders" },
        { href: "/account/looks", label: "Looks" },
        { href: "/account", label: accountLabel },
      ]
    : [
        { href: "/products", label: "Shop" },
        { href: "/account/orders", label: "Orders" },
        { href: "/account/looks", label: "Looks" },
        { href: "/login", label: "Sign in" },
        { href: "/register", label: "Create account" },
      ];

  return (
    <footer id="site-footer" className="mt-auto px-4 pt-6 pb-[calc(5.75rem+env(safe-area-inset-bottom))] md:px-6 md:pb-10">
      <div className="glass mx-auto grid max-w-6xl gap-6 rounded-3xl px-5 py-6 sm:grid-cols-[1fr_auto] sm:items-end sm:px-8">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span className="relative h-16 w-14 shrink-0 overflow-hidden">
              <Image
                src="/logo.png"
                alt=""
                width={779}
                height={841}
                className="absolute top-0 left-1/2 h-[128%] w-auto max-w-none -translate-x-1/2"
              />
            </span>
            <div className="min-w-0">
              <p className="truncate font-heading text-lg tracking-[0.16em]">TRINITY STYLES</p>
              <p className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">Ghana</p>
            </div>
          </div>
        </div>
        <nav className="grid grid-cols-2 gap-x-6 sm:grid-cols-1 sm:justify-items-end" aria-label="Footer">
          {links.map((item) => (
            <Link key={item.href} href={item.href} className="press flex h-11 min-w-0 items-center text-sm">
              <span className="truncate">{item.label}</span>
            </Link>
          ))}
          {signedIn ? <SignOutButton /> : null}
        </nav>
      </div>
    </footer>
  );
}
