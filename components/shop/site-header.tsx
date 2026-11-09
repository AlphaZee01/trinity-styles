"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Menu, Search, ShoppingBag, X } from "lucide-react";
import { categories as defaultCategories } from "@/lib/demo-catalog";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { useClientPathname } from "@/hooks/use-client-pathname";
import { useHydrated } from "@/hooks/use-hydrated";
import { usePresence } from "@/hooks/use-presence";
import { useCart } from "@/store/cart";

const audiences = [
  { href: "/?tab=women", label: "Women" },
  { href: "/?tab=men", label: "Men" },
  { href: "/?tab=new", label: "New In" },
];

function Mark({ overlay = false }: { overlay?: boolean }) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <span className="relative h-14 w-12 shrink-0 overflow-hidden">
        <Image
          src="/logo.png"
          alt=""
          width={779}
          height={841}
          priority
          className={`absolute top-0 left-1/2 h-[128%] w-auto max-w-none -translate-x-1/2 ${overlay ? "brightness-0 invert" : ""}`}
        />
      </span>
      <span className="min-w-0 text-left leading-none">
        <span
          className={`block truncate font-heading text-[13px] tracking-[0.16em] sm:text-sm sm:tracking-[0.2em] ${overlay ? "text-white" : ""}`}
        >
          TRINITY STYLES
        </span>
      </span>
    </span>
  );
}

export function SiteHeader({
  categories = defaultCategories,
  signedIn = false,
  accountLabel = "Account",
}: {
  categories?: string[];
  signedIn?: boolean;
  accountLabel?: string;
}) {
  const pathname = useClientPathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const hydrated = useHydrated();
  const count = useCart((state) => state.items.reduce((sum, item) => sum + item.quantity, 0));
  const visibleCount = hydrated ? count : 0;
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const menu = usePresence(menuOpen);
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const home = pathname === null || pathname === "/";
  const [scrolledPastHero, setScrolledPastHero] = useState(false);
  const solidHeader = !home || scrolledPastHero;
  const overlayHeader = home && !solidHeader;

  useEffect(() => {
    if (!home) return;
    function sync() {
      const hero = document.getElementById("home-hero");
      if (!hero) {
        setScrolledPastHero(false);
        return;
      }
      setScrolledPastHero(hero.getBoundingClientRect().bottom <= 80);
    }
    sync();
    window.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => {
      window.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, [home]);

  useEffect(() => {
    if (!menuOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    router.push(params.size ? `/products?${params}` : "/products");
    setSearchOpen(false);
    setMenuOpen(false);
  }

  return (
    <>
    <header
      className={`z-50 pt-[env(safe-area-inset-top)] transition-[background-color,border-color,box-shadow] duration-300 ease-[var(--ease-out)] motion-reduce:transition-none ${
        home
          ? overlayHeader
            ? `fixed inset-x-0 top-0 border-b border-transparent bg-transparent ${searchOpen ? "bg-black/25 backdrop-blur-md" : ""}`
            : "glass-chrome fixed inset-x-0 top-0"
          : "glass-chrome sticky top-0"
      }`}
    >
      <div className="mx-auto max-w-6xl px-3 sm:px-6">
        <div className="flex h-[4.5rem] items-center gap-1">
          <Link href="/" className="flex min-w-0 flex-1" aria-label="Trinity Styles home">
            <Mark overlay={overlayHeader} />
          </Link>
          <div className={`flex shrink-0 items-center ${overlayHeader ? "text-white" : ""}`}>
            <button
              type="button"
              aria-label="Search"
              aria-expanded={searchOpen}
              className="press grid size-11 place-items-center"
              onClick={() => setSearchOpen((open) => !open)}
            >
              <Search className="size-5" strokeWidth={1.75} />
            </button>
            <ThemeToggle overlay={overlayHeader} />
            <Link href="/cart" aria-label="Cart" className="press relative grid size-11 place-items-center">
              <ShoppingBag className="size-5" strokeWidth={1.75} />
              {visibleCount > 0 ? (
                <span
                  className={`absolute top-1 right-0 grid min-w-4 place-items-center rounded-full px-1 text-[10px] leading-4 ${
                    overlayHeader ? "bg-white text-foreground" : "bg-primary text-primary-foreground"
                  }`}
                >
                  {visibleCount}
                </span>
              ) : null}
            </Link>
            <button type="button" aria-label="Menu" className="press grid size-11 place-items-center" onClick={() => setMenuOpen(true)}>
              <Menu className="size-5" strokeWidth={1.75} />
            </button>
          </div>
        </div>
        {searchOpen ? (
          <form onSubmit={submitSearch} className="pb-3">
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search the collection"
              enterKeyHint="search"
              aria-label="Search the collection"
              className={`h-12 w-full rounded-full px-4 text-base ${
                overlayHeader ? "border border-white/25 bg-black/35 text-white placeholder:text-white/65 backdrop-blur-md" : "glass"
              }`}
            />
          </form>
        ) : null}
      </div>
    </header>
    {home ? null : (
      <div className="mx-auto w-full max-w-6xl px-4 pt-3 sm:px-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="press glass inline-flex h-11 items-center gap-1 rounded-full px-4 text-sm"
        >
          <ChevronLeft className="size-4" strokeWidth={1.75} />
          Back
        </button>
      </div>
    )}

      {menu.present ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Close menu"
            data-closed={menu.shown ? undefined : ""}
            className="side-scrim absolute inset-0 bg-foreground/35"
            onClick={() => setMenuOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            data-closed={menu.shown ? undefined : ""}
            className="side-panel glass absolute top-[max(0.75rem,env(safe-area-inset-top))] right-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] flex w-[min(86vw,22rem)] flex-col overflow-hidden rounded-3xl"
          >
            <div className="flex items-center justify-between gap-3 px-5 pt-5">
              <div className="flex min-w-0 items-center gap-3">
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
              <button type="button" aria-label="Close menu" className="press grid size-11 shrink-0 place-items-center" onClick={() => setMenuOpen(false)}>
                <X className="size-5" />
              </button>
            </div>
            <div className="mt-1 flex items-center px-3">
              <button
                type="button"
                aria-label="Search"
                aria-expanded={searchOpen}
                className="press grid size-11 place-items-center"
                onClick={() => setSearchOpen((open) => !open)}
              >
                <Search className="size-5" strokeWidth={1.75} />
              </button>
              <ThemeToggle />
              <Link
                href="/cart"
                aria-label="Cart"
                onClick={() => setMenuOpen(false)}
                className="press relative grid size-11 place-items-center"
              >
                <ShoppingBag className="size-5" strokeWidth={1.75} />
                {visibleCount > 0 ? (
                  <span className="absolute top-1 right-0 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] leading-4 text-primary-foreground">
                    {visibleCount}
                  </span>
                ) : null}
              </Link>
            </div>
            {searchOpen ? (
              <form onSubmit={submitSearch} className="px-4 pt-2">
                <input
                  autoFocus
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search the collection"
                  enterKeyHint="search"
                  aria-label="Search the collection"
                  className="glass h-12 w-full rounded-full px-4 text-base"
                />
              </form>
            ) : null}
            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
              <p className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">Shop for</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {audiences.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className="press flex h-11 items-center rounded-full bg-card px-4 text-sm shadow-[var(--shadow-card)]"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
              <button
                type="button"
                className="press mt-8 flex h-12 w-full items-center justify-between text-left"
                aria-expanded={categoriesOpen}
                onClick={() => setCategoriesOpen((open) => !open)}
              >
                <span className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">Categories</span>
                <ChevronDown
                  className={`size-4 text-muted-foreground transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none ${categoriesOpen ? "rotate-180" : ""}`}
                  aria-hidden="true"
                />
              </button>
              {categoriesOpen ? (
              <nav className="stagger mt-1 flex flex-col gap-2">
                <Link href="/products" onClick={() => setMenuOpen(false)} className="press flex h-12 items-center justify-between rounded-2xl px-1 text-base">
                  Shop all
                  <ChevronRight className="size-4 text-muted-foreground" />
                </Link>
                {categories.map((category) => (
                  <Link
                    key={category}
                    href={`/products?category=${encodeURIComponent(category)}`}
                    onClick={() => setMenuOpen(false)}
                    className="press flex h-12 items-center justify-between rounded-2xl px-1 text-base"
                  >
                    {category}
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </Link>
                ))}
              </nav>
              ) : null}
              <button
                type="button"
                className="press mt-8 flex h-12 w-full items-center justify-between text-left"
                aria-expanded={accountOpen}
                onClick={() => setAccountOpen((open) => !open)}
              >
                <span className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">Account</span>
                <ChevronDown
                  className={`size-4 text-muted-foreground transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none ${accountOpen ? "rotate-180" : ""}`}
                  aria-hidden="true"
                />
              </button>
              {accountOpen ? (
              <nav className="mt-1 flex flex-col gap-2">
                {(signedIn
                  ? [
                      { href: "/account/orders", label: "Orders" },
                      { href: "/account/looks", label: "Looks" },
                      { href: "/account", label: accountLabel },
                    ]
                  : [
                      { href: "/login", label: "Sign in" },
                      { href: "/register", label: "Create account" },
                    ]
                ).map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className="press flex h-12 items-center justify-between rounded-2xl px-1 text-base"
                  >
                    <span className="truncate">{item.label}</span>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  </Link>
                ))}
                {signedIn ? (
                  <SignOutButton
                    onDone={() => setMenuOpen(false)}
                    className="h-12 justify-between rounded-2xl px-1 text-base"
                  />
                ) : null}
              </nav>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

    </>
  );
}
