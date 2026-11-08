"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "@/store/cart";
import { Button } from "@/components/ui/button";

type SupportContact = {
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
};

function supportLine(contact: SupportContact) {
  if (contact.whatsapp) return `WhatsApp ${contact.whatsapp}`;
  if (contact.phone) return contact.phone;
  if (contact.email) return contact.email;
  return null;
}

export function SuccessClient({
  reference,
  support,
}: {
  reference: string | null;
  support: SupportContact;
}) {
  const clear = useCart((state) => state.clear);
  const [status, setStatus] = useState("Checking payment…");
  const helper = supportLine(support);

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;

    async function verify() {
      if (!reference) {
        setStatus("Missing payment reference.");
        return;
      }
      const response = await fetch(`/api/moolre/verify?reference=${encodeURIComponent(reference)}`);
      const json = await response.json();
      if (cancelled) return;
      if (response.ok && json.status === "paid") {
        clear();
        setStatus("Payment received. We are preparing your order.");
        return;
      }
      if (json.status === "failed") {
        setStatus(
          helper
            ? `Payment failed or was declined. Try checkout again or contact us at ${helper}.`
            : "Payment failed or was declined. Try checkout again from your bag.",
        );
        return;
      }
      if (json.error && typeof json.error === "string") {
        setStatus(json.error);
        return;
      }
      if (attempts < 12) {
        attempts += 1;
        setStatus("Waiting for approval on your phone…");
        window.setTimeout(() => void verify(), 5000);
        return;
      }
      setStatus(
        helper
          ? `Payment is still pending. Check My orders shortly or contact us at ${helper}.`
          : "Payment is still pending. Check My orders in a moment.",
      );
    }
    void verify();
    return () => {
      cancelled = true;
    };
  }, [reference, clear, helper]);

  return (
    <div className="glass mx-auto max-w-lg space-y-4 rounded-3xl p-8 text-center">
      <h1 className="font-heading text-4xl tracking-tight">Thank you</h1>
      <p className="text-muted-foreground">{status}</p>
      <Button className="h-12 rounded-full" nativeButton={false} render={<Link href="/account/orders" />}>
        View orders
      </Button>
    </div>
  );
}
