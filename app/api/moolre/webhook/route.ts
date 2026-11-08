import { NextResponse } from "next/server";
import { isMoolreConfigured, validateWebhookSecret } from "@/lib/moolre";
import { cancelPendingOrder, fulfillPaidOrder } from "@/lib/orders";

type MoolreWebhook = {
  status?: number;
  code?: string;
  data?: {
    txstatus?: number;
    externalref?: string;
    secret?: string;
    reason?: string;
  };
};

export async function POST(request: Request) {
  if (!isMoolreConfigured()) {
    return NextResponse.json({ error: "Moolre is not configured" }, { status: 503 });
  }

  let payload: MoolreWebhook;
  try {
    payload = (await request.json()) as MoolreWebhook;
  } catch {
    return NextResponse.json({ error: "Invalid callback" }, { status: 400 });
  }
  const data = payload.data;
  if (!data?.externalref || !validateWebhookSecret(data.secret)) {
    return NextResponse.json({ error: "Invalid callback" }, { status: 401 });
  }

  if (payload.status === 1 && payload.code === "P01" && data.txstatus === 1) {
    await fulfillPaidOrder(data.externalref);
  } else if (data.txstatus === 2) {
    await cancelPendingOrder(data.externalref);
  }

  return NextResponse.json({ received: true });
}
