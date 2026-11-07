import { notFound } from "next/navigation";
import { AddToCart } from "@/components/product/add-to-cart";
import { ProductGallery } from "@/components/product/product-gallery";
import { getProductBySlug, listProducts } from "@/lib/products";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  const newest = (await listProducts({ audience: "new" })).some((item) => item.id === product.id);

  return (
    <div className="mx-auto max-w-md">
      <ProductGallery images={product.images} name={product.name} productId={product.id} />
      <div className="pt-5">
        <AddToCart product={product} isNew={newest} />
      </div>
    </div>
  );
}
