import Image from "next/image";
import Link from "next/link";
import { EmptyState } from "@/components/states";
import { requireUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";
import { viewableTryOnImage } from "@/lib/try-on-result";
import { createClient } from "@/lib/supabase/server";

function formatWhen(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(iso));
}

function one<T>(value: T | T[] | null) {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

export default async function LooksPage() {
  const { userId } = await requireUser();
  if (!isSupabaseConfigured()) {
    return <EmptyState title="No looks yet" description="Connect Supabase, then try a piece on while signed in." />;
  }
  const supabase = await createClient();
  const [sessionsResult, savedResult] = await Promise.all([
    supabase
      .from("try_on_sessions")
      .select("id, created_at, result_image_url, products(name, slug)")
      .eq("user_id", userId)
      .eq("status", "completed")
      .not("result_image_url", "is", null)
      .order("created_at", { ascending: false }),
    supabase.from("saved_looks").select("try_on_session_id").eq("user_id", userId),
  ]);

  const savedIds = new Set((savedResult.data ?? []).map((row) => row.try_on_session_id));
  const looks = await Promise.all(
    (sessionsResult.data ?? []).map(async (session) => {
      const product = one(session.products as { name?: string; slug?: string } | { name?: string; slug?: string }[] | null);
      return {
        id: session.id,
        createdAt: session.created_at,
        name: product?.name ?? "Look",
        slug: product?.slug ?? null,
        saved: savedIds.has(session.id),
        image: await viewableTryOnImage(session.result_image_url),
      };
    }),
  );

  if (!looks.length) {
    return (
      <div className="space-y-6">
        <h1 className="font-heading text-4xl tracking-tight">My looks</h1>
        <EmptyState title="No try-ons yet" description="Try a piece on while you are signed in. Finished looks show up here, saved or not." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-4xl tracking-tight">My looks</h1>
        <p className="mt-2 text-sm text-muted-foreground">Every finished try-on from this account.</p>
      </header>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {looks.map((look) => (
          <figure key={look.id} className="overflow-hidden rounded-xl border border-border">
            <div className="relative aspect-[3/4] bg-muted">
              {look.image ? (
                <Image src={look.image} alt={look.name} fill sizes="(max-width: 768px) 50vw, 33vw" className="object-cover" />
              ) : null}
              {look.saved ? (
                <span className="absolute top-2 left-2 rounded-full bg-background/90 px-2 py-1 text-[10px] tracking-wide uppercase">
                  Saved
                </span>
              ) : null}
            </div>
            <figcaption className="space-y-1 p-3">
              {look.slug ? (
                <Link href={`/product/${look.slug}`} className="block truncate text-sm">
                  {look.name}
                </Link>
              ) : (
                <p className="truncate text-sm">{look.name}</p>
              )}
              <p className="text-xs text-muted-foreground">{formatWhen(look.createdAt)}</p>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
