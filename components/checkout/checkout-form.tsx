"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatGhs } from "@/lib/format";
type MoolreChannel = "13" | "6" | "7";
import { locateDeliveryAddress } from "@/lib/locate-address";
import { emptyShippingAddress } from "@/lib/shipping";
import { useHydrated } from "@/hooks/use-hydrated";
import { useCart } from "@/store/cart";
import type { ShippingAddress } from "@/lib/types";

type InitResponse = {
  status?: string;
  reference?: string;
  orderId?: string;
  message?: string;
  error?: string;
};

const NETWORKS: { id: MoolreChannel; label: string }[] = [
  { id: "13", label: "MTN MoMo" },
  { id: "6", label: "Telecel Cash" },
  { id: "7", label: "AT Money" },
];

export function CheckoutForm({
  defaults = emptyShippingAddress,
  shippingFeeGhs,
}: {
  defaults?: ShippingAddress;
  shippingFeeGhs: number;
}) {
  const router = useRouter();
  const hydrated = useHydrated();
  const items = useCart((state) => state.items);
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const total = subtotal + shippingFeeGhs;
  const [pending, setPending] = useState(false);
  const [locating, setLocating] = useState(false);
  const [address, setAddress] = useState(defaults);
  const [momoPhone, setMomoPhone] = useState(defaults.momo_phone ?? defaults.phone ?? "");
  const [channel, setChannel] = useState<MoolreChannel>("13");
  const [otpStep, setOtpStep] = useState<{ reference: string; orderId: string; message: string } | null>(null);
  const [otp, setOtp] = useState("");

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

  async function requestPayment(payload: Record<string, unknown>) {
    const response = await fetch("/api/moolre/initialize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = (await response.json()) as InitResponse;
    if (!response.ok) throw new Error(json.error ?? "Checkout failed");

    if (json.status === "otp_required" && json.reference) {
      setOtpStep({
        reference: json.reference,
        orderId: json.orderId ?? "",
        message: json.message ?? "Enter the code sent to your phone.",
      });
      toast.message(json.message ?? "Enter the OTP sent to your phone.");
      setPending(false);
      return;
    }

    if (json.status === "payment_requested" && json.reference) {
      toast.message(json.message ?? "Approve the prompt on your phone.");
      router.push(`/checkout/success?reference=${encodeURIComponent(json.reference)}`);
      return;
    }

    throw new Error(json.error ?? "Unexpected payment response.");
  }

  async function onSubmit(_formData: FormData) {
    setPending(true);
    try {
      await requestPayment({
        items: items.map((item) => ({ variantId: item.variantId, quantity: item.quantity })),
        channel,
        momoPhone: momoPhone.trim(),
        shippingAddress: {
          full_name: address.full_name,
          phone: address.phone,
          momo_phone: momoPhone.trim(),
          city: address.city,
          region: address.region,
          address_line: address.address_line,
          notes: address.notes ?? "",
        },
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Checkout failed");
      setPending(false);
    }
  }

  async function onSubmitOtp(event: React.FormEvent) {
    event.preventDefault();
    if (!otpStep || !otp.trim()) return;
    setPending(true);
    try {
      await requestPayment({
        reference: otpStep.reference,
        channel,
        otp: otp.trim(),
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Invalid OTP");
      setPending(false);
    }
  }

  if (otpStep) {
    return (
      <form onSubmit={onSubmitOtp} className="mx-auto max-w-md space-y-5 rounded-xl border border-border p-6">
        <h2 className="font-heading text-2xl tracking-tight">Verify your number</h2>
        <p className="text-sm text-muted-foreground">{otpStep.message}</p>
        <div className="space-y-2">
          <Label htmlFor="otp">One-time code</Label>
          <Input
            id="otp"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            value={otp}
            onChange={(event) => setOtp(event.target.value)}
            className="h-11 text-base tracking-widest"
          />
        </div>
        <Button type="submit" className="h-11 w-full" disabled={pending}>
          {pending ? "Confirming…" : "Continue to payment"}
        </Button>
        <button
          type="button"
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          onClick={() => {
            setOtpStep(null);
            setOtp("");
          }}
        >
          Back to checkout
        </button>
      </form>
    );
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
            <Label htmlFor="phone">Contact phone</Label>
            <Input id="phone" name="phone" required value={address.phone} onChange={(event) => setField("phone", event.target.value)} className="h-11 text-base" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="momo_phone">Mobile Money number</Label>
            <Input
              id="momo_phone"
              name="momo_phone"
              required
              value={momoPhone}
              onChange={(event) => setMomoPhone(event.target.value)}
              className="h-11 text-base"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="momo_network">Network</Label>
            <select
              id="momo_network"
              name="momo_network"
              required
              value={channel}
              onChange={(event) => setChannel(event.target.value as MoolreChannel)}
              className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-11 w-full rounded-md border px-3 text-base focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              {NETWORKS.map((network) => (
                <option key={network.id} value={network.id}>
                  {network.label}
                </option>
              ))}
            </select>
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
        <p className="text-sm text-muted-foreground">Pay with Moolre Mobile Money · GHS</p>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Items</dt>
            <dd>{formatGhs(subtotal)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Delivery</dt>
            <dd>{formatGhs(shippingFeeGhs)}</dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-border pt-2 font-medium">
            <dt>Total</dt>
            <dd className="font-heading text-2xl tracking-tight">{formatGhs(total)}</dd>
          </div>
        </dl>
        <p className="text-xs text-muted-foreground">You will approve the charge on the MoMo number above.</p>
        <Button type="submit" className="h-11 w-full" disabled={pending || !hydrated || items.length === 0}>
          {pending ? "Starting…" : "Pay now"}
        </Button>
      </aside>
    </form>
  );
}
