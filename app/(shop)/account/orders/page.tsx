import Image from "next/image";
import Link from "next/link";
import { EmptyState } from "@/components/states";
import { requireUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";
import { formatGhs } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

type PieceProduct = { name?: string; slug?: string; images?: string[] };

type OrderPiece = {
  quantity: number;
  product_variants:
    | {
        size?: string;
        color?: string;
        products: PieceProduct | PieceProduct[] | null;
      }
    | {
        size?: string;
        color?: string;
        products: PieceProduct | PieceProduct[] | null;
      }[]
    | null;
};

function one<T>(value: T | T[] | null | undefined) {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function formatWhen(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(iso));
}

export default async function OrdersPage() {
  const { userId } = await requireUser();
  if (!isSupabaseConfigured()) {
    return <EmptyState title="No orders yet" description="Connect Supabase to store order history." />;
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("*, order_items(quantity, product_variants(size, color, products(name, slug, images)))")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (!data?.length) {
    return (
      <div className="space-y-6">
        <h1 className="font-heading text-4xl tracking-tight">Orders</h1>
        <EmptyState title="No orders yet" description="When a Mobile Money payment lands, it will show here with status and total." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-4xl tracking-tight">Orders</h1>
      <ul className="space-y-3">
        {data.map((order) => {
          const pieces = (order.order_items ?? []) as OrderPiece[];
          return (
            <li key={order.id} className="glass space-y-3 rounded-2xl p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{order.paystack_reference}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    <time dateTime={order.created_at}>{formatWhen(order.created_at)}</time>
                  </p>
                </div>
                <p className="shrink-0 text-sm capitalize">{order.status}</p>
              </div>
              {pieces.length ? (
                <ul className="space-y-3">
                  {pieces.map((piece, index) => {
                    const variant = one(piece.product_variants);
                    const product = one(variant?.products);
                    const image = product?.images?.[0];
                    const label = [product?.name || "Piece", variant?.size, variant?.color].filter(Boolean).join(" · ");
                    const photo = (
                      <span className="relative block size-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                        {image ? <Image src={image} alt="" fill sizes="64px" className="object-cover" /> : null}
                      </span>
                    );
                    return (
                      <li key={`${order.id}-${index}`} className="flex items-center gap-3">
                        {product?.slug ? (
                          <Link href={`/product/${product.slug}`} className="press shrink-0" aria-label={label}>
                            {photo}
                          </Link>
                        ) : (
                          photo
                        )}
                        <div className="min-w-0">
                          <p className="text-sm break-words">{label}</p>
                          <p className="text-xs text-muted-foreground">×{piece.quantity}</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
              <p className="text-sm text-muted-foreground">
                {formatGhs(Number(order.total_amount))}
                {Number(order.shipping_fee) > 0 ? (
                  <span className="block text-xs">Includes delivery {formatGhs(Number(order.shipping_fee))}</span>
                ) : null}
              </p>
              {typeof order.tracking_number === "string" &&
              order.tracking_number &&
              (order.status === "shipped" || order.status === "delivered") ? (
                <p className="text-sm">
                  Tracking: <span className="font-medium break-all">{order.tracking_number}</span>
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
