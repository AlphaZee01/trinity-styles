"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatGhs } from "@/lib/format";
import { locateDeliveryAddress } from "@/lib/locate-address";
import { emptyShippingAddress } from "@/lib/shipping";
import { useHydrated } from "@/hooks/use-hydrated";
import { useCart } from "@/store/cart";
import type { ShippingAddress } from "@/lib/types";

export function CheckoutForm({ defaults = emptyShippingAddress }: { defaults?: ShippingAddress }) {
  const hydrated = useHydrated();
  const items = useCart((state) => state.items);
  const total = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const [pending, setPending] = useState(false);
  const [locating, setLocating] = useState(false);
  const [address, setAddress] = useState(defaults);

  function setField(field: keyof ShippingAddress, value: string) {
    setAddress((current) => ({ ...current, [field]: value }));
  }

  async function useLocation() {
    setLocating(true);
    try {
      const found = await locateDeliveryAddress();
      setAddress((current) => ({
        ...current,
        city: found.city,
        region: found.region,
        address_line: found.address_line,
      }));
      if (found.approximate) toast.message("Location is approximate. Check the street before you pay.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Location is unavailable.");
    } finally {
      setLocating(false);
    }
  }

  async function onSubmit(_formData: FormData) {
    setPending(true);
    try {
      const response = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({ variantId: item.variantId, quantity: item.quantity })),
          shippingAddress: {
            full_name: address.full_name,
            phone: address.phone,
            city: address.city,
            region: address.region,
            address_line: address.address_line,
            notes: address.notes ?? "",
          },
        }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "Checkout failed");
      window.location.href = json.authorizationUrl;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Checkout failed");
      setPending(false);
    }
  }

  return (
    <form action={onSubmit} className="grid gap-8 lg:grid-cols-[1fr_280px]">
      <div className="space-y-4 rounded-xl border border-border p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-heading text-2xl tracking-tight">Shipping</h2>
          <button
            type="button"
            onClick={useLocation}
            disabled={locating}
            className="press inline-flex h-11 items-center gap-2 rounded-full border border-foreground px-4 text-sm disabled:opacity-50"
          >
            <MapPin className="size-4" strokeWidth={1.75} />
            {locating ? "Finding address…" : "Use my location"}
          </button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="full_name">Full name</Label>
            <Input id="full_name" name="full_name" required value={address.full_name} onChange={(event) => setField("full_name", event.target.value)} className="h-11 text-base" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" required value={address.phone} onChange={(event) => setField("phone", event.target.value)} className="h-11 text-base" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input id="city" name="city" required value={address.city} onChange={(event) => setField("city", event.target.value)} className="h-11 text-base" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="region">Region</Label>
            <Input id="region" name="region" required value={address.region} onChange={(event) => setField("region", event.target.value)} className="h-11 text-base" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="address_line">Address</Label>
            <Input id="address_line" name="address_line" required value={address.address_line} onChange={(event) => setField("address_line", event.target.value)} className="h-11 text-base" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" value={address.notes ?? ""} onChange={(event) => setField("notes", event.target.value)} className="min-h-24 text-base" />
          </div>
        </div>
      </div>
      <aside className="h-fit space-y-4 rounded-xl border border-border p-5">
        <p className="text-sm text-muted-foreground">Pay with Paystack · GHS</p>
        <p className="font-heading text-3xl tracking-tight">{formatGhs(total)}</p>
        <Button type="submit" className="h-11 w-full" disabled={pending || !hydrated || items.length === 0}>
          {pending ? "Redirecting…" : "Pay now"}
        </Button>
      </aside>
    </form>
  );
}
