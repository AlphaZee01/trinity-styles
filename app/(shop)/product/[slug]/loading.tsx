"use client";

import { useParams } from "next/navigation";
import { ProductSkeleton } from "@/components/states/page-skeletons";

export default function ProductLoading() {
  const { slug } = useParams<{ slug: string }>();
  return <ProductSkeleton transitionName={slug ? `product-${slug}` : undefined} />;
}
