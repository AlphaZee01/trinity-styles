import Image from "next/image";
import Link from "next/link";
import { EmptyState } from "@/components/states";
import { requireUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";
import { formatGhs } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export default async function WishlistPage() {
  const { userId } = await requireUser();
  if (!isSupabaseConfigured()) {
    return (
      <EmptyState
        title="Wishlist is empty"
        description="Connect Supabase, then tap Save on a product. Long names still wrap in this empty state."
      />
    );
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("wishlist_items")
    .select("id, products(name, slug, images, base_price)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (!data?.length) {
    return (
      <div className="space-y-6">
        <h1 className="font-heading text-4xl tracking-tight">Wishlist</h1>
        <EmptyState title="Nothing saved" description="Heart a piece on its product page and it will land here." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-4xl tracking-tight">Wishlist</h1>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {data.map((item) => {
          const product = item.products as unknown as {
            name?: string;
            slug?: string;
            images?: string[];
            base_price?: number;
          } | null;
          if (!product?.slug) return null;
          return (
            <Link key={item.id} href={`/product/${product.slug}`} className="overflow-hidden rounded-xl border border-border">
              <div className="relative aspect-[3/4] bg-muted">
                {product.images?.[0] ? (
                  <Image
                    src={product.images[0]}
                    alt={product.name ?? ""}
                    fill
                    sizes="(max-width: 768px) 50vw, 33vw"
                    className="object-cover"
                  />
                ) : null}
              </div>
              <div className="p-3">
                <p className="font-medium">{product.name}</p>
                <p className="text-sm text-muted-foreground">{formatGhs(Number(product.base_price ?? 0))}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
