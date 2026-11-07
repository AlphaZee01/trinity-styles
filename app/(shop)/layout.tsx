import { Suspense } from "react";
import { BottomNav } from "@/components/shop/bottom-nav";
import { FloatingCart } from "@/components/shop/floating-cart";
import { PageView } from "@/components/shop/page-view";
import { SiteFooter } from "@/components/shop/site-footer";
import { SiteHeader } from "@/components/shop/site-header";
import { getAuthContext } from "@/lib/auth";
import { listCategoryNames } from "@/lib/categories";
import { listProducts } from "@/lib/products";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const [{ userId, profile }, products] = await Promise.all([getAuthContext(), listProducts()]);
  const categoryNames = await listCategoryNames(products.map((product) => product.category));

  return (
    <>
      <Suspense fallback={<div className="h-16" />}>
        <SiteHeader
          categories={categoryNames}
          signedIn={Boolean(userId)}
          accountLabel={profile?.full_name?.trim() || "Account"}
        />
      </Suspense>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-4 sm:px-6 md:pb-8">
        {children}
      </main>
      <SiteFooter />
      <BottomNav />
      <FloatingCart />
      <PageView />
    </>
  );
}
