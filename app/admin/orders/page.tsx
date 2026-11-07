import Link from "next/link";
import { OrderStatusForm } from "@/components/admin/order-status-form";
import { OrderStatusPill } from "@/components/admin/order-status-pill";
import { EmptyState } from "@/components/states";
import { type AdminOrder, type AdminOrderItem, listAdminOrders } from "@/lib/admin-data";
import { formatGhs } from "@/lib/format";
import type { OrderStatus } from "@/lib/types";

const statuses: OrderStatus[] = ["pending", "paid", "processing", "shipped", "delivered", "cancelled"];
const paidStatuses = new Set<OrderStatus>(["paid", "processing", "shipped", "delivered"]);

function isStatus(value: string | undefined): value is OrderStatus {
  return statuses.some((status) => status === value);
}

function formatWhen(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(iso));
}

function ordersHref(status: OrderStatus | null, q: string) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (q) params.set("q", q);
  const query = params.toString();
  return query ? `/admin/orders?${query}` : "/admin/orders";
}

function shipTo(address: Record<string, unknown> | null) {
  if (!address) return "";
  const text = (key: string) => (typeof address[key] === "string" ? address[key].trim() : "");
  const place = [text("city"), text("region")].filter(Boolean).join(", ");
  return [text("address_line"), place].filter(Boolean).join(" · ");
}

function pieceLabel(item: AdminOrderItem) {
  const variant = item.product_variants;
  const product = variant?.products;
  const name = Array.isArray(product) ? product[0]?.name : product?.name;
  const details = [name || "Piece", variant?.size, variant?.color].filter(Boolean).join(" · ");
  return `${details} ×${item.quantity}`;
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status, q } = await searchParams;
  const needle = q?.trim().toLowerCase() ?? "";
  const active = isStatus(status) ? status : null;
  const all = await listAdminOrders();
  const orders = all.filter((order) => {
    if (active && order.status !== active) return false;
    if (!needle) return true;
    const name = order.profiles?.full_name?.toLowerCase() ?? "";
    return name.includes(needle) || order.paystack_reference.toLowerCase().includes(needle);
  });
  const toFulfil = all.filter((order) => order.status === "paid" || order.status === "processing").length;
  const paid = all.reduce((sum, order) => (paidStatuses.has(order.status) ? sum + Number(order.total_amount) : sum), 0);
  const summaries = [
    { label: "Orders", value: String(all.length) },
    { label: "To fulfil", value: String(toFulfil) },
    { label: "Paid", value: formatGhs(paid) },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-4xl tracking-tight">Orders</h1>
        <p className="mt-2 text-muted-foreground">Update fulfilment after Paystack marks an order paid.</p>
      </div>
      {all.length === 0 ? (
        <EmptyState
          title="No orders"
          description="When a customer pays, the order appears here. A long payment reference still wraps."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            {summaries.map((item) => (
              <article key={item.label} className={`glass rounded-2xl p-4 ${item.label === "Paid" ? "col-span-2 lg:col-span-1" : ""}`}>
                <p className="text-[11px] tracking-[0.16em] uppercase">{item.label}</p>
                <p className="mt-3 font-heading text-3xl tracking-tight break-words">{item.value}</p>
              </article>
            ))}
          </div>
          <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Link
              href={ordersHref(null, needle)}
              className={`press inline-flex h-11 shrink-0 items-center rounded-full px-4 text-sm ${active ? "glass" : "bg-foreground text-background"}`}
            >
              All
            </Link>
            {statuses.map((item) => (
              <Link
                key={item}
                href={ordersHref(item, needle)}
                className={`press inline-flex h-11 shrink-0 items-center rounded-full px-4 text-sm capitalize ${
                  active === item ? "bg-foreground text-background" : "glass"
                }`}
              >
                {item}
              </Link>
            ))}
          </div>
          <form method="get">
            {active ? <input type="hidden" name="status" value={active} /> : null}
            <input
              name="q"
              defaultValue={q ?? ""}
              placeholder="Search name or reference"
              aria-label="Search orders"
              className="h-12 w-full rounded-full border border-border bg-card px-4 text-base shadow-[var(--shadow-card)]"
            />
          </form>
          {orders.length === 0 ? (
            <EmptyState title="No matches" description="Try another name, reference, or status." />
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function OrderCard({ order }: { order: AdminOrder }) {
  const destination = shipTo(order.shipping_address);
  const pieces = order.order_items ?? [];

  return (
    <article className="glass space-y-4 rounded-2xl p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          {order.user_id ? (
            <Link href={`/admin/customers/${order.user_id}`} className="font-medium break-words">
              {order.profiles?.full_name || "Customer"}
            </Link>
          ) : (
            <p className="font-medium">Customer</p>
          )}
          <p className="mt-1 text-sm text-muted-foreground">{formatWhen(order.created_at)}</p>
        </div>
        <div className="text-right">
          <p className="font-heading text-2xl tracking-tight">{formatGhs(Number(order.total_amount))}</p>
          <div className="mt-2 flex justify-end">
            <OrderStatusPill status={order.status} />
          </div>
        </div>
      </div>
      {pieces.length > 0 ? (
        <ul className="space-y-1 text-sm">
          {pieces.map((item, index) => (
            <li key={`${order.id}-${index}`} className="break-words">
              {pieceLabel(item)}
            </li>
          ))}
        </ul>
      ) : null}
      <p className="text-sm break-all text-muted-foreground">{order.paystack_reference}</p>
      {destination ? <p className="text-sm break-words">{destination}</p> : null}
      <OrderStatusForm orderId={order.id} status={order.status} />
    </article>
  );
}
