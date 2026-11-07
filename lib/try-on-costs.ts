import "server-only";

type BillingRecord = {
  startTime?: string;
  totalAmount?: number;
};

type BillingResponse = {
  records?: BillingRecord[];
  metadata?: { totals?: { totalAmount?: number } };
};

/** Spend on RunPod public endpoints for this API key. Job status drops the charge after the image expires. */
export async function getPublicEndpointSpend(apiKey: string) {
  if (!apiKey) return null;
  try {
    const response = await fetch("https://api.runpod.io/v2/billing/endpoints?bucketSize=day&lastN=90", {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return null;
    const json = (await response.json()) as BillingResponse;
    const records = json.records ?? [];
    const monthStart = Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1);
    const monthSpendUsd = records.reduce((sum, record) => {
      const start = record.startTime ? new Date(record.startTime).getTime() : 0;
      return start >= monthStart ? sum + Number(record.totalAmount || 0) : sum;
    }, 0);
    const reported = Number(json.metadata?.totals?.totalAmount);
    const spendUsd = Number.isFinite(reported)
      ? reported
      : records.reduce((sum, record) => sum + Number(record.totalAmount || 0), 0);
    const firstStart = records.reduce<number | null>((earliest, record) => {
      const start = record.startTime ? new Date(record.startTime).getTime() : NaN;
      if (!Number.isFinite(start)) return earliest;
      return earliest == null || start < earliest ? start : earliest;
    }, null);
    const days = firstStart == null ? 0 : Math.max(1, (Date.now() - firstStart) / 86_400_000);
    return {
      spendUsd,
      monthSpendUsd,
      dailySpendUsd: days > 0 ? spendUsd / days : 0,
      paceSince: firstStart == null ? null : new Date(firstStart).toISOString(),
    };
  } catch {
    return null;
  }
}
