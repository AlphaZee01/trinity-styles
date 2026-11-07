import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";
import { listCategoryNames } from "@/lib/categories";
import { listAllProducts } from "@/lib/products";
import { listColorNames, listSizeNames } from "@/lib/variant-options";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const products = await listAllProducts();
  const product = products.find((item) => item.id === id);
  if (!product) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-4xl tracking-tight">Edit product</h1>
      </div>
      <ProductForm
        product={product}
        categories={await listCategoryNames(products.map((item) => item.category))}
        sizes={await listSizeNames(products.flatMap((item) => item.product_variants.map((variant) => variant.size)))}
        colors={await listColorNames(products.flatMap((item) => item.product_variants.map((variant) => variant.color)))}
      />
    </div>
  );
}
