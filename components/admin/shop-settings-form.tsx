"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type ShopSettingsPayload = {
  shippingFeeGhs: number;
  contactPhone: string | null;
  contactWhatsapp: string | null;
  contactEmail: string | null;
  returnsPolicy: string;
  deliveryNote: string;
  sizeGuideNote: string;
};

export function ShopSettingsForm({ initial }: { initial: ShopSettingsPayload }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState({
    shippingFeeGhs: String(initial.shippingFeeGhs),
    contactPhone: initial.contactPhone ?? "",
    contactWhatsapp: initial.contactWhatsapp ?? "",
    contactEmail: initial.contactEmail ?? "",
    returnsPolicy: initial.returnsPolicy,
    deliveryNote: initial.deliveryNote,
    sizeGuideNote: initial.sizeGuideNote,
  });

  return (
    <form
      className="max-w-2xl space-y-6"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        try {
          const response = await fetch("/api/admin/shop-settings", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              shippingFeeGhs: Number(form.shippingFeeGhs),
              contactPhone: form.contactPhone || null,
              contactWhatsapp: form.contactWhatsapp || null,
              contactEmail: form.contactEmail || null,
              returnsPolicy: form.returnsPolicy,
              deliveryNote: form.deliveryNote,
              sizeGuideNote: form.sizeGuideNote,
            }),
          });
          const json = await response.json();
          if (!response.ok) throw new Error(json.error ?? "Could not save");
          toast.success("Shop settings saved");
          router.refresh();
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Could not save");
        } finally {
          setPending(false);
        }
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="shipping_fee">Delivery fee (GHS)</Label>
        <Input
          id="shipping_fee"
          type="number"
          min={0}
          step="0.01"
          required
          value={form.shippingFeeGhs}
          onChange={(event) => setForm((current) => ({ ...current, shippingFeeGhs: event.target.value }))}
          className="h-11"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="contact_phone">Contact phone</Label>
          <Input
            id="contact_phone"
            value={form.contactPhone}
            onChange={(event) => setForm((current) => ({ ...current, contactPhone: event.target.value }))}
            className="h-11"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact_whatsapp">WhatsApp number</Label>
          <Input
            id="contact_whatsapp"
            value={form.contactWhatsapp}
            onChange={(event) => setForm((current) => ({ ...current, contactWhatsapp: event.target.value }))}
            className="h-11"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="contact_email">Contact email</Label>
          <Input
            id="contact_email"
            type="email"
            value={form.contactEmail}
            onChange={(event) => setForm((current) => ({ ...current, contactEmail: event.target.value }))}
            className="h-11"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="delivery_note">Delivery note</Label>
        <Textarea
          id="delivery_note"
          required
          value={form.deliveryNote}
          onChange={(event) => setForm((current) => ({ ...current, deliveryNote: event.target.value }))}
          className="min-h-24"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="returns_policy">Returns policy</Label>
        <Textarea
          id="returns_policy"
          required
          value={form.returnsPolicy}
          onChange={(event) => setForm((current) => ({ ...current, returnsPolicy: event.target.value }))}
          className="min-h-28"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="size_guide_note">Size guide note</Label>
        <Textarea
          id="size_guide_note"
          required
          value={form.sizeGuideNote}
          onChange={(event) => setForm((current) => ({ ...current, sizeGuideNote: event.target.value }))}
          className="min-h-20"
        />
      </div>
      <Button type="submit" className="h-11 rounded-full px-6" disabled={pending}>
        {pending ? "Saving…" : "Save settings"}
      </Button>
    </form>
  );
}
