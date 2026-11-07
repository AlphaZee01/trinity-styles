"use client";

import { useState } from "react";
import { toast } from "sonner";
import { formatGhs, formatUsd, usdToGhs } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const BILLING_URL = "https://www.console.runpod.io/user/billing";

function formatSpan(days: number) {
  if (days < 1 / 24) return "less than an hour";
  if (days < 1) {
    const hours = Math.max(1, Math.round(days * 24));
    return hours === 1 ? "1 hour" : `${hours} hours`;
  }
  if (days < 60) {
    const whole = Math.max(1, Math.round(days));
    return whole === 1 ? "1 day" : `${whole} days`;
  }
  if (days < 365) {
    const weeks = Math.max(1, Math.round(days / 7));
    return weeks === 1 ? "1 week" : `${weeks} weeks`;
  }
  const years = Math.max(1, Math.round(days / 365));
  return years === 1 ? "1 year" : `${years} years`;
}

function formatWhen(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(iso));
}

export function TryOnCredit({
  dailySpendUsd,
  paceSince,
  initialBalance,
}: {
  dailySpendUsd: number | null;
  paceSince: string | null;
  initialBalance: number | null;
}) {
  const [balance, setBalance] = useState(initialBalance == null ? "" : String(initialBalance));
  const [saved, setSaved] = useState(initialBalance);
  const [saving, setSaving] = useState(false);
  const amount = Number(balance);
  const valid = balance.trim() !== "" && Number.isFinite(amount) && amount >= 0;

  let lasts = "Enter the balance to see how long it lasts.";
  if (dailySpendUsd == null) {
    lasts = "The RunPod bill could not be loaded, so the pace is unknown.";
  } else if (valid && amount === 0) {
    lasts = "Nothing left.";
  } else if (valid && dailySpendUsd <= 0) {
    lasts = "No try-on spend yet, so this balance is not being used.";
  } else if (valid) {
    const days = amount / dailySpendUsd;
    const until = new Date(Date.now() + days * 86_400_000).toISOString();
    lasts = `Lasts ${formatSpan(days)}, until ${formatWhen(until)}.`;
  }

  async function saveBalance() {
    const next = balance.trim() === "" ? null : Number(balance);
    if (next != null && (!Number.isFinite(next) || next < 0)) {
      toast.error("Enter a balance of zero or more.");
      return;
    }
    if (next === saved || (next != null && saved != null && Math.abs(next - saved) < 0.001)) return;
    setSaving(true);
    try {
      const response = await fetch("/api/admin/try-on-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runpodBalanceUsd: next }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "Could not save the balance");
      setSaved(next);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the balance");
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="glass rounded-3xl p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] tracking-[0.16em] uppercase">Remaining</p>
        <a
          href={BILLING_URL}
          target="_blank"
          rel="noreferrer"
          className="press inline-flex h-11 shrink-0 items-center rounded-full bg-primary px-4 text-sm text-primary-foreground"
        >
          Top up
        </a>
      </div>
      <p className="mt-2 font-heading text-4xl tabular-nums tracking-tight">
        {valid ? formatGhs(usdToGhs(amount)) : "—"}
      </p>
      <p className="mt-1 text-sm tabular-nums text-muted-foreground">{valid ? formatUsd(amount) : "No balance entered"}</p>
      <p className="mt-4 text-sm">{lasts}</p>
      {dailySpendUsd != null && dailySpendUsd > 0 ? (
        <p className="mt-1 text-xs text-muted-foreground">
          {`${formatUsd(dailySpendUsd)} a day${paceSince ? ` since ${formatWhen(paceSince)}` : ""}.${saving ? " Saving…" : ""}`}
        </p>
      ) : null}
      <form
        className="mt-5 max-w-sm space-y-2"
        onSubmit={(event) => {
          event.preventDefault();
          void saveBalance();
        }}
      >
        <Label htmlFor="tryon-balance">Update balance (USD)</Label>
        <div className="flex gap-2">
          <Input
            id="tryon-balance"
            inputMode="decimal"
            className="h-11 flex-1 rounded-xl bg-background px-3 text-base tabular-nums"
            placeholder="0.00"
            value={balance}
            onChange={(event) => setBalance(event.target.value)}
          />
          <button
            type="submit"
            className="press h-11 shrink-0 rounded-full bg-foreground px-4 text-sm text-background disabled:opacity-50"
            disabled={saving}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </article>
  );
}
