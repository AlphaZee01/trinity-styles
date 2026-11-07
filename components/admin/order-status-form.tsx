"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { OrderStatus } from "@/lib/types";

const statuses: OrderStatus[] = ["pending", "paid", "processing", "shipped", "delivered", "cancelled"];

export function OrderStatusForm({ orderId, status }: { orderId: string; status: OrderStatus }) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [pending, setPending] = useState(false);

  return (
    <form
      className="flex flex-col gap-2 sm:flex-row sm:items-center"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        try {
          const response = await fetch(`/api/admin/orders/${orderId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: value }),
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
    </form>
  );
}
