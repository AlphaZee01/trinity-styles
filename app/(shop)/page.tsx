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
      <section className="relative overflow-hidden rounded-3xl">
        <div className="relative h-[46svh] min-h-72 bg-muted sm:h-[52svh]">
          {hero?.images[0] ? (
            <Image
              src={hero.images[0]}
              alt=""
              fill
              priority
              loading="eager"
              className="object-cover object-[center_20%]"
              sizes="(max-width: 768px) 100vw, 1152px"
            />
          ) : null}
        </div>
        <div className="glass absolute inset-x-3 bottom-3 rounded-2xl p-4 sm:inset-x-6 sm:bottom-6 sm:max-w-md sm:p-6">
          <p className="text-[10px] tracking-[0.18em] uppercase">New collection</p>
          <h1 className="mt-2 font-heading text-4xl leading-[0.95] tracking-tight text-pretty sm:text-5xl">
            Elevated essentials
          </h1>
          <p className="mt-3 text-sm text-pretty text-muted-foreground">
            Timeless pieces. Modern silhouettes. Made for the way you live.
          </p>
          <Link
            href="/products"
            className="press cta-premium mt-4 inline-flex h-12 items-center rounded-full bg-primary px-5 text-sm text-primary-foreground"
          >
            Shop the collection
          </Link>
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
