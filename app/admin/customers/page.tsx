import Link from "next/link";
import { EmptyState } from "@/components/states";
import { listCustomers } from "@/lib/admin-data";

function formatWhen(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(iso));
}

function countLabel(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const needle = q?.trim().toLowerCase() ?? "";
  const customers = (await listCustomers()).filter((customer) => {
    if (!needle) return true;
    return (customer.full_name ?? "").toLowerCase().includes(needle) || (customer.phone ?? "").includes(needle);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-4xl tracking-tight">Customers</h1>
        <p className="mt-2 text-muted-foreground">Profiles, with their orders and try-ons.</p>
      </div>
      <form method="get">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search name or phone"
          aria-label="Search customers"
          className="h-12 w-full rounded-full border border-border bg-card px-4 text-base shadow-[var(--shadow-card)]"
        />
      </form>
      {customers.length === 0 ? (
        <EmptyState
          title={needle ? "No matches" : "No customers yet"}
          description={
            needle
              ? "Try another name or phone number."
              : "Profiles appear after signup. A name like Nana Ama Serwaa Boateng-Osei still wraps."
          }
        />
      ) : (
        <ul className="space-y-3">
          {customers.map((customer) => (
            <li key={customer.id}>
              <Link href={`/admin/customers/${customer.id}`} className="press glass block rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 font-medium break-words">{customer.full_name || "Unnamed customer"}</p>
                  {customer.role === "admin" ? (
                    <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] tracking-wide text-primary">Admin</span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm break-words text-muted-foreground">{customer.phone || "No phone"}</p>
                <p className="mt-2 text-sm break-words text-muted-foreground">
                  {countLabel(customer.orders, "order", "orders")}
                  {" · "}
                  {countLabel(customer.tryOns, "try-on", "try-ons")}
                  {" · "}
                  Joined {formatWhen(customer.created_at)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
