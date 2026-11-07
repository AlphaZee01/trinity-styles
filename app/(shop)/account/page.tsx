import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ShippingAddressForm } from "@/components/account/shipping-address-form";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { requireUser } from "@/lib/auth";
import { shippingFromProfile } from "@/lib/shipping";
import { formatGhs } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

function formatWhen(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(iso));
}

function one<T>(value: T | T[] | null | undefined) {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export default async function AccountPage() {
  const { userId, profile, email } = await requireUser();
  const supabase = await createClient();
  const [ordersResult, looksResult, wishlistResult] = await Promise.all([
    supabase
      .from("orders")
      .select("id, status, total_amount, created_at", { count: "exact" })
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("try_on_sessions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "completed"),
    supabase
      .from("wishlist_items")
      .select("id, products(name, slug, images, base_price)", { count: "exact" })
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(4),
  ]);

  const orders = ordersResult.data ?? [];
  const saved = wishlistResult.data ?? [];
  const name = profile?.full_name?.trim() || "";
  const firstName = name.split(/\s+/)[0];
  const summaries = [
    { href: "/account/orders", label: "Orders", count: ordersResult.count ?? orders.length },
    { href: "/account/looks", label: "Looks", count: looksResult.count ?? 0 },
    { href: "/account/wishlist", label: "Wishlist", count: wishlistResult.count ?? saved.length },
  ];

  return (
    <div className="space-y-8">
      <header>
        <p className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">Account</p>
        <h1 className="mt-2 font-heading text-4xl tracking-tight">{firstName ? `Hello, ${firstName}` : "Your account"}</h1>
        {email ? <p className="mt-2 truncate text-sm text-muted-foreground">{email}</p> : null}
      </header>

      <section className="glass rounded-3xl px-5 py-5">
        <p className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">Profile</p>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-muted-foreground">Name</dt>
            <dd className="min-w-0 truncate font-medium">{name || "Not set"}</dd>
          </div>
          {profile?.phone ? (
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-muted-foreground">Phone</dt>
              <dd className="min-w-0 truncate font-medium">{profile.phone}</dd>
            </div>
          ) : null}
          {profile?.created_at ? (
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-muted-foreground">Member since</dt>
              <dd className="font-medium">{formatWhen(profile.created_at)}</dd>
            </div>
          ) : null}
        </dl>
      </section>

      <ShippingAddressForm
        userId={userId ?? ""}
        defaults={shippingFromProfile(profile)}
        saved={Boolean(profile?.shipping_address?.address_line?.trim())}
      />

      <nav className="stagger grid gap-3 sm:grid-cols-3" aria-label="Account sections">
        {summaries.map((item) => (
          <Link key={item.href} href={item.href} className="press glass flex min-h-20 items-center justify-between rounded-2xl px-4">
            <span className="min-w-0">
              <span className="block font-heading text-3xl tracking-tight">{item.count}</span>
              <span className="text-sm text-muted-foreground">{item.label}</span>
            </span>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </Link>
        ))}
      </nav>

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-heading text-2xl tracking-tight">Recent orders</h2>
          <Link href="/account/orders" className="press text-sm text-muted-foreground">
            View all
          </Link>
        </div>
        {orders.length ? (
          <ul className="space-y-3">
            {orders.map((order) => (
              <li key={order.id} className="glass flex items-center justify-between gap-4 rounded-2xl px-4 py-4">
                <div className="min-w-0">
                  <p className="text-sm capitalize">{order.status}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatWhen(order.created_at)}</p>
                </div>
                <p className="shrink-0 text-sm font-medium">{formatGhs(Number(order.total_amount))}</p>
              </li>
            ))}
          </ul>
        ) : (
          <div className="glass rounded-2xl px-4 py-5">
            <p className="text-sm text-muted-foreground">No orders yet.</p>
            <Link href="/products" className="press mt-3 inline-flex h-11 items-center text-sm font-medium">
              Shop the collection
            </Link>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-heading text-2xl tracking-tight">Saved pieces</h2>
          <Link href="/account/wishlist" className="press text-sm text-muted-foreground">
            View all
          </Link>
        </div>
        {saved.length ? (
          <ul className="flex gap-3 overflow-x-auto pb-1">
            {saved.map((item) => {
              const product = one(
                item.products as
                  | { name?: string; slug?: string; images?: string[]; base_price?: number }
                  | { name?: string; slug?: string; images?: string[]; base_price?: number }[]
                  | null,
              );
              if (!product?.slug) return null;
              return (
                <li key={item.id} className="w-36 shrink-0">
                  <Link href={`/product/${product.slug}`} className="press block">
                    <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-muted">
                      {product.images?.[0] ? (
                        <Image src={product.images[0]} alt={product.name ?? ""} fill className="object-cover" sizes="144px" />
                      ) : null}
                    </div>
                    <p className="mt-2 truncate text-sm">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{formatGhs(Number(product.base_price ?? 0))}</p>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="glass rounded-2xl px-4 py-5">
            <p className="text-sm text-muted-foreground">Nothing saved yet. Heart a piece on its page.</p>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <ThemeToggle labelled />
        <SignOutButton className="h-12 w-full justify-center rounded-2xl bg-destructive px-4 text-white" />
        {profile?.role === "admin" ? (
          <Link href="/admin" className="press glass flex h-12 items-center justify-between rounded-2xl px-4 text-sm">
            Open admin
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>
        ) : null}
      </section>
    </div>
  );
}
