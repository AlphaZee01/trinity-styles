"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { OrderStatus } from "@/lib/types";

const statuses: OrderStatus[] = ["pending", "paid", "processing", "shipped", "delivered", "cancelled"];

export function OrderStatusForm({
  orderId,
  status,
  trackingNumber = "",
}: {
  orderId: string;
  status: OrderStatus;
  trackingNumber?: string | null;
}) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [tracking, setTracking] = useState(trackingNumber ?? "");
  const [pending, setPending] = useState(false);

  return (
    <form
      className="space-y-3"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        try {
          const response = await fetch(`/api/admin/orders/${orderId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              status: value,
              trackingNumber: tracking.trim() || null,
            }),
          });
          const json = await response.json();
          if (!response.ok) throw new Error(json.error ?? "Could not update");
          toast.success("Order updated");
          router.refresh();
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Could not update");
        } finally {
          setPending(false);
        }
      }}
    >
      {value === "cancelled" && ["paid", "processing", "shipped"].includes(status) ? (
        <p className="text-xs text-muted-foreground">
          Stock is put back on the shelf. Refund Mobile Money manually in the Moolre dashboard.
        </p>
      ) : null}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <select
          aria-label="Order status"
          className="h-11 w-full rounded-full border border-input bg-background px-3 text-base capitalize sm:w-40"
          value={value}
          onChange={(event) => setValue(event.target.value as OrderStatus)}
        >
          {statuses.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <Button type="submit" className="h-11 w-full rounded-full px-4 sm:w-auto" disabled={pending}>
          Update
        </Button>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`tracking-${orderId}`}>Tracking reference</Label>
        <Input
          id={`tracking-${orderId}`}
          value={tracking}
          onChange={(event) => setTracking(event.target.value)}
          placeholder="Courier or hand-off reference"
          className="h-11"
        />
      </div>
    </form>
  );
}
