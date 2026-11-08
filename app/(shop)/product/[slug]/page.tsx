import { notFound } from "next/navigation";
import { AddToCart } from "@/components/product/add-to-cart";
import { ProductGallery } from "@/components/product/product-gallery";
import { getAuthContext } from "@/lib/auth";
import { getProductBySlug, listProducts } from "@/lib/products";
import { getShopSettings } from "@/lib/shop-settings";
import { getResolvedTryOnSettings, isTryOnAiConfigured } from "@/lib/try-on-settings";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  const [newest, shop, tryOnSettings, tryOnReady, auth] = await Promise.all([
    listProducts({ audience: "new" }),
    getShopSettings(),
    getResolvedTryOnSettings(),
    isTryOnAiConfigured(),
    getAuthContext(),
  ]);
  const tryOnEnabled = tryOnReady || (process.env.NODE_ENV !== "production" && tryOnSettings.useStubWhenUnconfigured);

  return (
    <div className="mx-auto max-w-md">
      <ProductGallery images={product.images} name={product.name} productId={product.id} />
      <div className="pt-5">
        <AddToCart
          product={product}
          isNew={newest.some((item) => item.id === product.id)}
          shippingFeeGhs={shop.shippingFeeGhs}
          sizeGuideNote={shop.sizeGuideNote}
          tryOnEnabled={tryOnEnabled}
          signedIn={Boolean(auth.userId)}
        />
      </div>
    </div>
  );
}
