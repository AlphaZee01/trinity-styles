"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, MapPin } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { locateDeliveryAddress } from "@/lib/locate-address";
import { createClient } from "@/lib/supabase/client";
import type { ShippingAddress } from "@/lib/types";

export function ShippingAddressForm({
  userId,
  defaults,
  saved = false,
}: {
  userId: string;
  defaults: ShippingAddress;
  saved?: boolean;
}) {
  const router = useRouter();
  const [address, setAddress] = useState(defaults);
  const [pending, setPending] = useState(false);
  const [locating, setLocating] = useState(false);
  const [stored, setStored] = useState(saved);
  const [open, setOpen] = useState(!saved);

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
      if (found.approximate) toast.message("Location is approximate. Check the street before you save.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Location is unavailable.");
    } finally {
      setLocating(false);
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    try {
      const supabase = createClient();
      const shipping_address = {
        full_name: address.full_name.trim(),
        phone: address.phone.trim(),
        city: address.city.trim(),
        region: address.region.trim(),
        address_line: address.address_line.trim(),
        notes: address.notes?.trim() || "",
      };
      const { error } = await supabase
        .from("profiles")
        .update({ shipping_address, phone: shipping_address.phone })
        .eq("id", userId);
      if (error) throw error;
      toast.success("Shipping address saved");
      setStored(true);
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the address");
    } finally {
      setPending(false);
    }
  }

  const summary = [address.address_line, address.city, address.region].filter(Boolean).join(", ");

  return (
    <form onSubmit={onSubmit} className="glass space-y-4 rounded-3xl px-5 py-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {stored ? (
          <button
            type="button"
            className="press flex min-w-0 flex-1 items-center gap-3 text-left"
            aria-expanded={open}
            onClick={() => setOpen((current) => !current)}
          >
            <span className="min-w-0">
              <span className="block font-heading text-2xl tracking-tight">Shipping address</span>
              <span className="mt-1 block truncate text-sm text-muted-foreground">
                {open ? "Checkout starts with this address." : summary || "Saved"}
              </span>
            </span>
            <ChevronDown
              className={`size-5 shrink-0 text-muted-foreground transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
              aria-hidden="true"
            />
          </button>
        ) : (
          <div>
            <h2 className="font-heading text-2xl tracking-tight">Shipping address</h2>
            <p className="mt-1 text-sm text-muted-foreground">Checkout starts with this address.</p>
          </div>
        )}
        {open ? (
          <button
            type="button"
            onClick={useLocation}
            disabled={locating}
            className="press inline-flex h-11 items-center gap-2 rounded-full border border-foreground px-4 text-sm disabled:opacity-50"
          >
            <MapPin className="size-4" strokeWidth={1.75} />
            {locating ? "Finding address…" : "Use my location"}
          </button>
        ) : null}
      </div>
      {open ? <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="account_full_name">Full name</Label>
          <Input id="account_full_name" required value={address.full_name} onChange={(event) => setField("full_name", event.target.value)} className="h-11 text-base" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="account_phone">Phone</Label>
          <Input id="account_phone" required value={address.phone} onChange={(event) => setField("phone", event.target.value)} className="h-11 text-base" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="account_city">City</Label>
          <Input id="account_city" required value={address.city} onChange={(event) => setField("city", event.target.value)} className="h-11 text-base" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="account_region">Region</Label>
          <Input id="account_region" required value={address.region} onChange={(event) => setField("region", event.target.value)} className="h-11 text-base" />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="account_address_line">Address</Label>
          <Input id="account_address_line" required value={address.address_line} onChange={(event) => setField("address_line", event.target.value)} className="h-11 text-base" />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="account_notes">Notes</Label>
          <Textarea id="account_notes" value={address.notes ?? ""} onChange={(event) => setField("notes", event.target.value)} className="min-h-24 text-base" />
        </div>
      </div> : null}
      {open ? (
        <button type="submit" disabled={pending} className="press h-12 rounded-full bg-primary px-5 text-sm text-primary-foreground disabled:opacity-50">
          {pending ? "Saving…" : "Save address"}
        </button>
      ) : null}
    </form>
  );
}
