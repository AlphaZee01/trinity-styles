import Link from "next/link";
import { getDashboardStats, getSiteAnalytics, listAdminOrders } from "@/lib/admin-data";
import { formatGhs } from "@/lib/format";
import { OrderStatusPill } from "@/components/admin/order-status-pill";

const cards = [
  { key: "revenue" as const, label: "Revenue" },
  { key: "orders" as const, label: "Orders" },
  { key: "tryOns" as const, label: "Try-ons" },
];

function pageLabel(path: string) {
  if (path === "/") return "Home";
  if (path === "/products") return "Shop";
  if (path === "/cart") return "Bag";
  if (path === "/login") return "Sign in";
  if (path === "/register") return "Create account";
  if (path === "/checkout") return "Checkout";
  if (path.startsWith("/product/")) {
    return path
      .slice("/product/".length)
      .split("-")
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }
  if (path === "/account") return "Account";
  if (path === "/account/orders") return "Account orders";
  if (path === "/account/wishlist") return "Wishlist";
  if (path === "/account/looks") return "Saved looks";
  if (path.startsWith("/account")) return "Account";
  return path;
}

function formatWhen(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(iso));
}

export default async function AdminHomePage() {
  const [stats, orders, analytics] = await Promise.all([getDashboardStats(), listAdminOrders(), getSiteAnalytics()]);
  const peak = analytics.pages[0]?.views ?? 1;
  const deltas = {
    revenue: stats.revenueDelta,
    orders: stats.orderDelta,
    tryOns: stats.tryOnDelta,
  };
  const values = {
    revenue: formatGhs(stats.revenue),
    orders: String(stats.orders),
    tryOns: String(stats.tryOns),
  };

  return (
    <div className="space-y-8">
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-heading text-2xl tracking-tight">Key metrics</h1>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/settings/try-on" className="press inline-flex h-11 items-center rounded-full border border-border px-4 text-sm">
              Try-on AI
            </Link>
            <Link href="/account" className="press inline-flex h-11 items-center rounded-full border border-foreground px-4 text-sm">
              Your account
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {cards.map((card) => (
            <article key={card.key} className={`glass rounded-2xl p-4 ${card.key === "tryOns" ? "col-span-2 lg:col-span-1" : ""}`}>
              <p className="text-[11px] tracking-[0.16em] uppercase">{card.label}</p>
              <p className="mt-3 font-heading text-3xl tracking-tight">{values[card.key]}</p>
              {deltas[card.key] != null ? (
                <p className="mt-2 text-xs text-olive">{deltas[card.key]! > 0 ? "+" : ""}{deltas[card.key]}% vs yesterday</p>
              ) : null}
            </article>
          ))}
        </div>
      </section>
      <section className="space-y-3">
        <h2 className="font-heading text-2xl tracking-tight">Visitors</h2>
        <div className="grid grid-cols-2 gap-3">
          <article className="glass rounded-2xl p-4">
            <p className="text-[11px] tracking-[0.16em] uppercase">Page views</p>
            <p className="mt-3 font-heading text-3xl tracking-tight tabular-nums">{analytics.views}</p>
            {analytics.viewDelta != null ? (
              <p className="mt-2 text-xs text-olive">{analytics.viewDelta > 0 ? "+" : ""}{analytics.viewDelta}% vs yesterday</p>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">Today, since midnight</p>
            )}
          </article>
          <article className="glass rounded-2xl p-4">
            <p className="text-[11px] tracking-[0.16em] uppercase">People</p>
            <p className="mt-3 font-heading text-3xl tracking-tight tabular-nums">{analytics.visitors}</p>
            {analytics.visitorDelta != null ? (
              <p className="mt-2 text-xs text-olive">{analytics.visitorDelta > 0 ? "+" : ""}{analytics.visitorDelta}% vs yesterday</p>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">Different browsers today</p>
            )}
          </article>
        </div>
        {analytics.pages.length === 0 ? (
          <p className="glass rounded-2xl p-4 text-sm text-muted-foreground">No shop visits yet today.</p>
        ) : (
          <ol className="space-y-2">
            {analytics.pages.map((page) => (
              <li key={page.path} className="glass rounded-2xl p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="min-w-0 break-words font-medium">{pageLabel(page.path)}</p>
                  <p className="shrink-0 tabular-nums">
                    <span className="font-heading text-2xl tracking-tight">{page.views}</span>
                    <span className="ml-1 text-xs text-muted-foreground">{page.views === 1 ? "view" : "views"}</span>
                  </p>
                </div>
                <div className="mt-3 h-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(8, Math.round((page.views / peak) * 100))}%` }} />
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-heading text-2xl tracking-tight">Recent orders</h2>
          <Link href="/admin/orders" className="text-sm text-muted-foreground">View all</Link>
        </div>
        {orders.length === 0 ? (
          <p className="glass rounded-2xl p-4 text-sm text-muted-foreground">
            {stats.demo ? "Connect Supabase to load live orders." : "No orders yet."}
          </p>
        ) : (
          <ul className="space-y-2">
            {orders.slice(0, 5).map((order) => (
              <li key={order.id}>
                <Link href="/admin/orders" className="press glass flex items-center gap-3 rounded-2xl p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{order.paystack_reference}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {order.profiles?.full_name || "Customer"} · {formatWhen(order.created_at)}
                    </p>
                  </div>
                  <OrderStatusPill status={order.status} />
                  <span className="text-sm">{formatGhs(Number(order.total_amount))}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
