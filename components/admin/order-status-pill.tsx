import type { OrderStatus } from "@/lib/types";

const tones: Record<OrderStatus, string> = {
  pending: "bg-muted text-muted-foreground",
  paid: "bg-primary/10 text-primary",
  processing: "bg-primary/10 text-primary",
  shipped: "bg-primary/15 text-primary",
  delivered: "bg-primary text-primary-foreground",
  cancelled: "bg-muted text-muted-foreground",
};

export function OrderStatusPill({ status }: { status: OrderStatus }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] tracking-wide capitalize ${tones[status]}`}>
      {status}
    </span>
  );
}
