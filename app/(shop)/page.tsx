import Image from "next/image";
import Link from "next/link";
import { Gem, Leaf, Truck } from "lucide-react";
import { ProductFeed } from "@/components/product/product-feed";
import { listCategoryNames } from "@/lib/categories";
import { listProducts } from "@/lib/products";

const trust = [
  { icon: Leaf, title: "Sustainable materials", detail: "Thoughtfully sourced" },
  { icon: Gem, title: "Premium quality", detail: "Crafted to last" },
  { icon: Truck, title: "Complimentary shipping", detail: "On orders over GH₵150" },
];

const audiences = [
  { id: "all", label: "All", href: "/" },
  { id: "women", label: "Women", href: "/?tab=women" },
  { id: "men", label: "Men", href: "/?tab=men" },
  { id: "new", label: "New In", href: "/?tab=new" },
];

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const audience = tab === "women" || tab === "men" || tab === "new" ? tab : "all";
  const [catalog, newest] = await Promise.all([listProducts(), listProducts({ audience: "new" })]);
  const categories = await listCategoryNames(catalog.map((product) => product.category));
  const hero = catalog[0];
  const products =
    audience === "women"
      ? catalog.filter((product) => product.gender !== "men")
      : audience === "men"
        ? catalog.filter((product) => product.gender !== "women")
        : audience === "new"
          ? [...catalog].sort((a, b) => b.created_at.localeCompare(a.created_at))
          : catalog;

  return (
    <div className="space-y-10">
      <section className="home-hero relative -mx-4 overflow-hidden sm:mx-0 sm:rounded-3xl">
        <div className="relative flex h-[100svh] max-h-[52rem] min-h-[22rem] items-center justify-center bg-muted sm:h-[min(54svh,40rem)] sm:max-h-none sm:min-h-80">
          {hero?.images[0] ? (
            <div className="home-hero-media absolute inset-0" aria-hidden>
              <Image
                src={hero.images[0]}
                alt=""
                fill
                priority
                loading="eager"
                className="object-cover object-center"
                sizes="(max-width: 768px) 100vw, 1152px"
              />
            </div>
          ) : null}
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/65 sm:from-black/25 sm:via-black/35 sm:to-black/55"
            aria-hidden
          />
          <div className="relative z-10 mx-auto max-w-md px-6 text-center text-white sm:max-w-xl sm:px-8">
            <p className="text-[10px] tracking-[0.2em] text-white/80 uppercase sm:text-[11px]">New collection</p>
            <h1 className="mt-3 font-heading text-[1.875rem] leading-[1.2] tracking-tight text-pretty sm:mt-2 sm:text-5xl sm:leading-[0.95]">
              Elevated essentials
            </h1>
            <p className="mt-3 text-base leading-relaxed text-pretty text-white/88 sm:mt-3 sm:text-sm sm:text-white/85">
              Timeless pieces. Modern silhouettes. Made for the way you live.
            </p>
            <div className="mt-6 flex flex-col items-center gap-3 sm:mt-5 sm:flex-row sm:justify-center">
              <Link
                href="/products"
                className="press inline-flex h-11 min-w-[10.5rem] items-center justify-center rounded-sm bg-white px-5 text-[17px] font-medium text-foreground sm:h-12 sm:rounded-full sm:text-sm"
              >
                Shop the collection
              </Link>
              <Link
                href="/?tab=new"
                className="press inline-flex h-11 min-w-[10.5rem] items-center justify-center rounded-sm border border-white/55 bg-white/10 px-5 text-[17px] font-medium text-white backdrop-blur-sm sm:h-12 sm:rounded-full sm:text-sm"
              >
                New arrivals
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-3">
          <h2 className="font-heading text-2xl tracking-tight">Categories</h2>
          <Link href="/products" className="text-xs tracking-[0.14em] text-muted-foreground uppercase">
            View all
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {categories.map((category) => {
            const sample = catalog.find((product) => product.category === category);
            return (
              <Link
                key={category}
                href={`/products?category=${encodeURIComponent(category)}`}
                className="press relative h-36 w-40 shrink-0 overflow-hidden rounded-2xl bg-muted"
              >
                {sample?.images[0] ? (
                  <Image src={sample.images[0]} alt="" fill sizes="160px" className="object-cover" />
                ) : null}
                <span className="glass absolute inset-x-2 bottom-2 rounded-xl px-3 py-2 font-heading text-lg leading-none">
                  {category}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-heading text-2xl tracking-tight">Favorites</h2>
          <div className="flex flex-wrap gap-2" aria-label="Filter favorites">
            {audiences.map((item) => {
              const active = item.id === audience;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`press flex h-10 items-center rounded-full px-4 text-sm ${
                    active ? "bg-primary text-primary-foreground" : "glass text-muted-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
        <ProductFeed key={audience} products={products} newIds={audience === "new" ? newest.map((product) => product.id) : []} />
      </section>

      <section className="glass grid gap-4 rounded-3xl p-4 sm:grid-cols-4 sm:p-6">
        {trust.map((item) => (
          <div key={item.title} className="min-w-0">
            <item.icon className="size-4 text-primary" strokeWidth={1.75} />
            <p className="mt-2 text-[11px] tracking-[0.12em] uppercase">{item.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
          </div>
        ))}
        <div className="min-w-0">
          <p className="text-[11px] tracking-[0.12em] text-primary uppercase">Easy returns</p>
          <p className="mt-2 text-sm text-muted-foreground">Within 30 days. No fuss.</p>
        </div>
      </section>
    </div>
  );
}
