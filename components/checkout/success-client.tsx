"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "@/store/cart";
import { Button } from "@/components/ui/button";

export function SuccessClient({ reference }: { reference: string | null }) {
  const clear = useCart((state) => state.clear);
  const [status, setStatus] = useState("Checking payment…");

  useEffect(() => {
    let cancelled = false;
    async function verify() {
      if (!reference) {
        setStatus("Missing payment reference.");
        return;
      }
      const response = await fetch(`/api/paystack/verify?reference=${encodeURIComponent(reference)}`);
      const json = await response.json();
      if (cancelled) return;
      if (response.ok && json.status === "paid") {
        clear();
        setStatus("Payment received. We are preparing your order.");
      } else {
        setStatus(json.error ?? "Payment is still pending. Refresh in a moment.");
      }
    }
    void verify();
    return () => {
      cancelled = true;
    };
  }, [reference, clear]);

  return (
    <div className="glass mx-auto max-w-lg space-y-4 rounded-3xl p-8 text-center">
      <h1 className="font-heading text-4xl tracking-tight">Thank you</h1>
      <p className="text-muted-foreground">{status}</p>
      <Button className="h-12 rounded-full" nativeButton={false} render={<Link href="/account/orders" />}>View orders</Button>
    </div>
  );
}
