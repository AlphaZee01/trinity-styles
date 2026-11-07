import { TryOnCredit } from "@/components/admin/try-on-credit";
import { getTryOnManagement } from "@/lib/admin-data";
import { formatGhs, formatUsd, USD_TO_GHS, usdToGhs } from "@/lib/format";

function Stat({ label, value, dollar, note }: { label: string; value: string; dollar?: string; note?: string }) {
  return (
    <article className="glass rounded-2xl p-4">
      <p className="text-[11px] tracking-[0.16em] uppercase">{label}</p>
      <p className="mt-2 font-heading text-3xl tabular-nums tracking-tight">{value}</p>
      {dollar ? <p className="mt-1 text-sm tabular-nums text-muted-foreground">{dollar}</p> : null}
      {note ? <p className="mt-2 text-xs text-muted-foreground">{note}</p> : null}
    </article>
  );
}

export async function TryOnSummary() {
  const stats = await getTryOnManagement();
  if (stats.demo) {
    return (
      <p className="glass rounded-2xl p-4 text-sm text-muted-foreground">Connect Supabase to load try-on usage.</p>
    );
  }

  const spendNotes = [
    stats.fromBill ? "Public endpoint bill" : null,
    !stats.fromBill && stats.unpriced > 0 ? `${stats.unpriced} finished without a stored charge` : null,
    !stats.fromBill && stats.unpriced === 0 ? "RunPod bill could not be loaded" : null,
  ].filter(Boolean);

  return (
    <div className="space-y-8">
      <TryOnCredit
        dailySpendUsd={stats.fromBill ? stats.dailySpendUsd : null}
        paceSince={stats.paceSince}
        initialBalance={stats.balanceUsd}
      />

      <section className="space-y-3">
        <h2 className="font-heading text-2xl tracking-tight">Spend</h2>
        <div className="grid grid-cols-2 gap-3">
          <article className="glass col-span-2 rounded-2xl p-4">
            <p className="text-[11px] tracking-[0.16em] uppercase">Rate</p>
            <p className="mt-2 font-heading text-2xl tracking-tight">
              {stats.workerLabel && stats.listPriceUsd != null
                ? `${stats.workerLabel}`
                : "No listed rate"}
            </p>
            {stats.listPriceUsd != null ? (
              <>
                <p className="mt-2 font-heading text-3xl tabular-nums tracking-tight">
                  {formatGhs(usdToGhs(stats.listPriceUsd))}
                  <span className="text-base font-normal text-muted-foreground"> per image</span>
                </p>
                <p className="mt-1 text-sm tabular-nums text-muted-foreground">{formatUsd(stats.listPriceUsd)} per image</p>
              </>
            ) : null}
            <p className="mt-2 text-xs text-muted-foreground">
              Bank of Ghana mid rate, {formatGhs(USD_TO_GHS)} to the dollar.
            </p>
          </article>
          <Stat
            label="All time"
            value={formatGhs(usdToGhs(stats.spendUsd))}
            dollar={formatUsd(stats.spendUsd)}
            note={spendNotes.join(" · ") || undefined}
          />
          <Stat
            label="This month"
            value={formatGhs(usdToGhs(stats.monthSpendUsd))}
            dollar={formatUsd(stats.monthSpendUsd)}
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-2xl tracking-tight">Activity</h2>
        <div className="grid grid-cols-2 gap-3">
          <Stat
            label="Finished"
            value={String(stats.completed)}
            note={`${stats.failed} failed · ${stats.running} still running${
              stats.successRate == null ? "" : ` · ${stats.successRate}% succeeded`
            }`}
          />
          <Stat label="Real runs" value={String(stats.real)} note={`${stats.stub} previews`} />
          <Stat
            label="Customers"
            value={String(stats.customers)}
            note={`${stats.signedInRuns} signed-in runs · ${stats.guestRuns} guest runs`}
          />
          <Stat label="Saved looks" value={String(stats.savedLooks)} />
          <article className="glass col-span-2 rounded-2xl p-4">
            <p className="text-[11px] tracking-[0.16em] uppercase">Tried on most</p>
            {stats.topProducts.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">No try-ons yet.</p>
            ) : (
              <ol className="mt-3 space-y-2">
                {stats.topProducts.map((product, index) => (
                  <li key={product.id} className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate">
                      <span className="mr-2 tabular-nums text-muted-foreground">{index + 1}</span>
                      {product.name}
                    </span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">{product.count}</span>
                  </li>
                ))}
              </ol>
            )}
          </article>
        </div>
      </section>
    </div>
  );
}
