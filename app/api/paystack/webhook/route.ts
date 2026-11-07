import { NextResponse } from "next/server";
import { getPaystackSecret } from "@/lib/env";
import { fulfillPaidOrder } from "@/lib/orders";
import { verifyWebhookSignature } from "@/lib/paystack";

export async function POST(request: Request) {
  if (!getPaystackSecret()) {
    return NextResponse.json({ error: "Paystack is not configured" }, { status: 503 });
  }
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");
  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody) as {
    event?: string;
    data?: { reference?: string; status?: string };
  };
  if (event.event === "charge.success" && event.data?.reference) {
    await fulfillPaidOrder(event.data.reference);
  }
  return NextResponse.json({ received: true });
}
