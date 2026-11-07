import { ProductForm } from "@/components/admin/product-form";
import { listCategoryNames } from "@/lib/categories";
import { listAllProducts } from "@/lib/products";
import { listColorNames, listSizeNames } from "@/lib/variant-options";

export default async function NewProductPage() {
  const products = await listAllProducts();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-4xl tracking-tight">New product</h1>
        <p className="mt-2 text-muted-foreground">A photo first, then the name, price, and at least one size.</p>
      </div>
      <ProductForm
        categories={await listCategoryNames(products.map((product) => product.category))}
        sizes={await listSizeNames(products.flatMap((product) => product.product_variants.map((variant) => variant.size)))}
        colors={await listColorNames(products.flatMap((product) => product.product_variants.map((variant) => variant.color)))}
      />
    </div>
  );
}
