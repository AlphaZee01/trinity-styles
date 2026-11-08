import {
  getMoolreAccountNumber,
  getMoolreApiPubKey,
  getMoolreApiUser,
  getMoolreWebhookSecret,
} from "@/lib/env";

const MOOLRE_PAYMENT = "https://api.moolre.com/open/transact/payment";
const MOOLRE_STATUS = "https://api.moolre.com/open/transact/status";

export type MoolreChannel = "13" | "6" | "7";

export type MoolreApiResponse = {
  status?: number;
  code?: string;
  message?: string;
  txstatus?: number;
  externalref?: string;
  data?: unknown;
};

export function isMoolreConfigured() {
  return Boolean(getMoolreApiUser() && getMoolreApiPubKey() && getMoolreAccountNumber());
}

function headers() {
  const user = getMoolreApiUser();
  const pubkey = getMoolreApiPubKey();
  if (!user || !pubkey) throw new Error("Moolre API credentials are not configured.");
  return {
    "Content-Type": "application/json",
    "X-API-USER": user,
    "X-API-PUBKEY": pubkey,
  };
}

export function formatMoolreAmount(amountGhs: number) {
  return amountGhs.toFixed(2);
}

/** Normalize to a Ghana mobile number Moolre accepts (e.g. 0241234567). */
export function normalizeMoMoPhone(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("233") && digits.length >= 12) {
    return `0${digits.slice(3)}`;
  }
  if (digits.startsWith("0") && digits.length === 10) return digits;
  if (digits.length === 9) return `0${digits}`;
  return digits;
}

async function postMoolre(url: string, body: Record<string, unknown>) {
  const response = await fetch(url, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });
  const json = (await response.json()) as MoolreApiResponse;
  return { ok: response.ok, json };
}

export async function initiateCollection(payload: {
  channel: MoolreChannel;
  payer: string;
  amountGhs: number;
  externalref: string;
  otpcode?: string;
}) {
  const accountnumber = getMoolreAccountNumber();
  if (!accountnumber) throw new Error("MOOLRE_ACCOUNT_NUMBER is not configured.");

  const body: Record<string, unknown> = {
    type: 1,
    channel: payload.channel,
    currency: "GHS",
    payer: normalizeMoMoPhone(payload.payer),
    amount: formatMoolreAmount(payload.amountGhs),
    externalref: payload.externalref,
    accountnumber,
    reference: `Trinity Styles order ${payload.externalref}`,
  };
  if (payload.otpcode) body.otpcode = payload.otpcode;

  const { json } = await postMoolre(MOOLRE_PAYMENT, body);
  return json;
}

export async function checkPaymentStatus(externalref: string) {
  const accountnumber = getMoolreAccountNumber();
  if (!accountnumber) throw new Error("MOOLRE_ACCOUNT_NUMBER is not configured.");

  const { json } = await postMoolre(MOOLRE_STATUS, {
    type: 1,
    idtype: "1",
    id: externalref,
    accountnumber,
  });
  return json;
}

export type InitiateOutcome =
  | { kind: "otp_required"; message: string }
  | { kind: "invalid_otp"; message: string }
  | { kind: "payment_requested"; message: string }
  | { kind: "error"; message: string };

export function interpretInitiateResponse(json: MoolreApiResponse): InitiateOutcome {
  const code = (json.code ?? "").toUpperCase();
  const message = json.message ?? "Moolre could not start the payment.";

  if (code === "TP14") {
    return { kind: "otp_required", message };
  }
  if (code === "400_INVALID_OTP" || message.toLowerCase().includes("invalid otp")) {
    return { kind: "invalid_otp", message };
  }
  if (code === "400_NON_UNIQUE_REF") {
    return { kind: "error", message: "This payment reference was already used. Start checkout again." };
  }
  if (
    code.includes("PAYMENT") ||
    code === "TP01" ||
    message.toLowerCase().includes("payment prompt") ||
    message.toLowerCase().includes("payment request")
  ) {
    return { kind: "payment_requested", message };
  }
  if (message.toLowerCase().includes("otp verified")) {
    return { kind: "payment_requested", message };
  }
  if (json.status === 1 && code && !code.startsWith("400")) {
    return { kind: "payment_requested", message };
  }
  return { kind: "error", message };
}

export function isPaymentSuccessful(status: MoolreApiResponse) {
  const tx = status.txstatus ?? (status.data as { txstatus?: number } | undefined)?.txstatus;
  if (tx === 1) return true;
  if (status.code === "SS01" && status.txstatus === 1) return true;
  return status.status === 1 && status.txstatus === 1;
}

export function isPaymentFailed(status: MoolreApiResponse) {
  const tx = status.txstatus ?? (status.data as { txstatus?: number } | undefined)?.txstatus;
  return tx === 2;
}

export function validateWebhookSecret(secret: string | undefined) {
  const expected = getMoolreWebhookSecret();
  if (!expected || !secret) return false;
  return secret === expected;
}
