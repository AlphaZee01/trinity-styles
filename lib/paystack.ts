import { getPaystackSecret } from "@/lib/env";
import { createHmac, timingSafeEqual } from "crypto";

const PAYSTACK_API = "https://api.paystack.co";

function secret() {
  const key = getPaystackSecret();
  if (!key) throw new Error("PAYSTACK_SECRET_KEY is not configured");
  return key;
}

export async function initializeTransaction(payload: {
  email: string;
  amount: number;
  reference: string;
  callback_url: string;
  metadata?: Record<string, unknown>;
}) {
  const response = await fetch(`${PAYSTACK_API}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ...payload, currency: "GHS" }),
  });
  const json = await response.json();
  if (!response.ok || !json.status) {
    throw new Error(json.message ?? "Paystack initialize failed");
  }
  return json.data as { authorization_url: string; reference: string; access_code: string };
}

export async function verifyTransaction(reference: string) {
  const response = await fetch(
    `${PAYSTACK_API}/transaction/verify/${encodeURIComponent(reference)}`,
    { headers: { Authorization: `Bearer ${secret()}` } },
  );
  const json = await response.json();
  if (!response.ok || !json.status) {
    throw new Error(json.message ?? "Paystack verify failed");
  }
  return json.data as { status: string; reference: string; amount: number };
}

export function verifyWebhookSignature(rawBody: string, signature: string | null) {
  if (!signature) return false;
  const hash = createHmac("sha512", secret()).update(rawBody).digest("hex");
  const a = Buffer.from(hash);
  const b = Buffer.from(signature);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
