import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderStatusPill } from "@/components/admin/order-status-pill";
import { TryOnHistory } from "@/components/admin/try-on-history";
import { EmptyState } from "@/components/states";
import { getCustomerDetail } from "@/lib/admin-data";
import { formatGhs } from "@/lib/format";
import { shippingFromProfile } from "@/lib/shipping";
import type { OrderStatus } from "@/lib/types";

const spentStatuses = new Set<OrderStatus>(["paid", "processing", "shipped", "delivered"]);

function formatWhen(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(iso));
}

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { profile, orders, tryOns } = await getCustomerDetail(id);
  if (!profile) notFound();

  const spent = orders.reduce((sum, order) => {
    return spentStatuses.has(order.status) ? sum + Number(order.total_amount) : sum;
  }, 0);
  const address = shippingFromProfile(profile);
  const hasAddress = Boolean(address.address_line || address.city || address.region);
  const summaries = [
    { label: "Orders", value: String(orders.length) },
    { label: "Spent", value: formatGhs(spent) },
    { label: "Try-ons", value: String(tryOns.length) },
  ];

  return (
    <div className="space-y-8">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-heading text-4xl tracking-tight break-words">{profile.full_name || "Unnamed customer"}</h1>
          {profile.role === "admin" ? (
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] tracking-wide text-primary">Admin</span>
          ) : null}
        </div>
        <p className="mt-2 break-words text-muted-foreground">{profile.phone || "No phone"}</p>
        <p className="mt-1 text-sm text-muted-foreground">Joined {formatWhen(profile.created_at)}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {summaries.map((item) => (
          <article key={item.label} className={`glass rounded-2xl p-4 ${item.label === "Try-ons" ? "col-span-2 lg:col-span-1" : ""}`}>
            <p className="text-[11px] tracking-[0.16em] uppercase">{item.label}</p>
            <p className="mt-3 font-heading text-3xl tracking-tight break-words">{item.value}</p>
          </article>
        ))}
      </div>

      {hasAddress ? (
        <section className="glass rounded-2xl p-4">
          <h2 className="font-heading text-2xl tracking-tight">Shipping address</h2>
          <p className="mt-3 break-words">{address.address_line}</p>
          <p className="break-words text-muted-foreground">
            {[address.city, address.region].filter(Boolean).join(", ")}
          </p>
          {address.notes ? <p className="mt-2 break-words text-sm text-muted-foreground">{address.notes}</p> : null}
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="font-heading text-2xl tracking-tight">Orders</h2>
        {orders.length === 0 ? (
          <EmptyState title="No orders" description="Paid and pending checkouts will list here." />
        ) : (
          <ul className="space-y-3">
            {orders.map((order) => (
              <li key={order.id}>
                <Link href="/admin/orders" className="press glass flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4">
                  <div className="min-w-0">
                    <p className="font-medium break-all">{order.paystack_reference}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatWhen(order.created_at)} · {formatGhs(Number(order.total_amount))}
                    </p>
                  </div>
                  <OrderStatusPill status={order.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-2xl tracking-tight">Try-on history</h2>
        {tryOns.length === 0 ? (
          <EmptyState title="No try-ons" description="Sessions for this customer show here." />
        ) : (
          <TryOnHistory
            sessions={tryOns.map((session) => ({
              id: session.id,
              productName: session.productName,
              status: session.status,
              when: formatWhen(session.created_at),
              personImage: session.personImage,
              resultImage: session.resultImage,
            }))}
          />
        )}
      </section>
    </div>
  );
}
