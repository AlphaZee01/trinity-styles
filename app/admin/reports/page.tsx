import Link from "next/link";
import { EmptyState } from "@/components/states";
import { getTryOnAnalytics } from "@/lib/admin-data";

function countLabel(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export default async function AdminReportsPage() {
  const analytics = await getTryOnAnalytics();
  const ranked = analytics.filter((row) => row.tries > 0);
  const totalTries = ranked.reduce((sum, row) => sum + row.tries, 0);
  const totalBought = ranked.reduce((sum, row) => sum + row.purchases, 0);
  const peak = ranked[0]?.tries ?? 1;
  const summaries = [
    { label: "Try-ons", value: String(totalTries), note: "Sessions, including repeats and previews" },
    { label: "Pieces tried", value: String(ranked.length), note: "Different products" },
    { label: "Bought after", value: String(totalBought), note: "Customers who also ordered that piece" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl tracking-tight">Reports</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Pieces customers tried on, and which of those they also bought.
        </p>
      </div>
      {ranked.length === 0 ? (
        <EmptyState title="No try-ons yet" description="Sessions appear here after a customer tries a piece on." />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            {summaries.map((item) => (
              <article
                key={item.label}
                className={`glass rounded-2xl p-4 ${item.label === "Bought after" ? "col-span-2 lg:col-span-1" : ""}`}
              >
                <p className="text-[11px] tracking-[0.16em] uppercase">{item.label}</p>
                <p className="mt-2 font-heading text-3xl tabular-nums tracking-tight">{item.value}</p>
                <p className="mt-2 text-xs text-muted-foreground">{item.note}</p>
              </article>
            ))}
          </div>
          <section className="space-y-3">
            <h2 className="font-heading text-2xl tracking-tight">Most tried</h2>
            <ol className="space-y-3">
              {ranked.map((row, index) => (
                <li key={row.productId}>
                  <Link href={`/admin/products/${row.productId}`} className="press glass block rounded-2xl p-4">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="min-w-0 break-words">
                        <span className="tabular-nums text-muted-foreground">{index + 1}</span>
                        <span className="ml-2 font-medium">{row.name}</span>
                      </p>
                      <p className="shrink-0 text-right">
                        <span className="font-heading text-2xl tabular-nums tracking-tight">{row.tries}</span>
                        <span className="ml-1 text-xs text-muted-foreground">{row.tries === 1 ? "try" : "tries"}</span>
                      </p>
                    </div>
                    <div className="mt-3 h-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${Math.max(8, Math.round((row.tries / peak) * 100))}%` }}
                      />
                    </div>
                    <p className="mt-3 text-sm break-words text-muted-foreground">
                      {countLabel(row.customers, "signed-in customer", "signed-in customers")}
                      {" · "}
                      {row.purchases === 0 ? "None bought it" : countLabel(row.purchases, "bought it", "bought it")}
                      {" · "}
                      {Math.round(row.conversion * 100)}%
                    </p>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        </>
      )}
    </div>
  );
}
