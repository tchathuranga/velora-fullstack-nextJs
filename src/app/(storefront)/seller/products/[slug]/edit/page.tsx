"use client";

import { notFound, useParams } from "next/navigation";
import { ProductForm } from "@/components/seller/ProductForm";
import { PageLoader } from "@/components/ui/PageLoader";
import { useGetProductQuery } from "@/Redux/api";

export default function EditProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: product, isLoading, isError } = useGetProductQuery(slug);

  if (isLoading) return <PageLoader />;
  if (isError || !product) notFound();

  return <ProductForm product={product} />;
}
