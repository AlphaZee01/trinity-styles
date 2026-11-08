"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";

export function WishlistButton({
  productId,
  productName,
  appearance = "row",
}: {
  productId: string;
  productName?: string;
  appearance?: "row" | "float";
}) {
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pop, setPop] = useState(0);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    let cancel = false;
    const supabase = createClient();
    supabase.auth.getClaims().then(({ data }) => {
      const userId = data?.claims?.sub as string | undefined;
      if (!userId || cancel) return;
      supabase
        .from("wishlist_items")
        .select("id")
        .eq("user_id", userId)
        .eq("product_id", productId)
        .maybeSingle()
        .then(({ data: row }) => {
          if (!cancel && row) setSaved(true);
        });
    });
    return () => {
      cancel = true;
    };
  }, [productId]);

  async function save() {
    if (saved || pending) return;
    if (!isSupabaseConfigured()) {
      toast.error("Connect Supabase to save a wishlist.");
      return;
    }
    setPending(true);
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getClaims();
      const userId = data?.claims?.sub as string | undefined;
      if (!userId) {
        toast.error("Sign in to save pieces.");
        return;
      }
      const { error } = await supabase.from("wishlist_items").upsert(
        { user_id: userId, product_id: productId },
        { onConflict: "user_id,product_id" },
      );
      if (error) throw error;
      setSaved(true);
      setPop((count) => count + 1);
      toast.success("Saved to wishlist", {
        description: productName ?? "View it anytime from your wishlist.",
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save");
    } finally {
      setPending(false);
    }
  }

  const icon = (
    <Heart
      key={pop}
      className={`size-4 ${saved ? "heart-pop text-primary" : ""}`}
      fill={saved ? "currentColor" : "none"}
      strokeWidth={1.75}
    />
  );

  if (appearance === "float") {
    return (
      <button
        type="button"
        aria-label={saved ? "Saved to wishlist" : "Add to wishlist"}
        aria-pressed={saved}
        disabled={pending || saved}
        onClick={save}
        className="press glass absolute top-[38%] right-3 z-10 grid size-11 place-items-center rounded-full text-foreground"
      >
        {icon}
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-pressed={saved}
      disabled={pending || saved}
      onClick={save}
      className={`press glass flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm ${saved ? "text-primary" : ""}`}
    >
      {icon}
      {saved ? "Saved" : "Add to wishlist"}
    </button>
  );
}
