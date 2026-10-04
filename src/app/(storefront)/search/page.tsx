"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ProductGrid } from "@/components/product/ProductGrid";
import { PageLoader } from "@/components/ui/PageLoader";
import { useProducts } from "@/context/ProductsContext";

function SearchInner() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const { products, loading } = useProducts();

  if (loading) return <PageLoader />;

  const query = q.trim().toLowerCase();
  const results = query
    ? products.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.brand?.toLowerCase().includes(query) ||
          p.description.replace(/<[^>]*>/g, " ").toLowerCase().includes(query),
      )
    : products;

  return (
    <div className="container-page py-8">
      <h1 className="text-2xl font-bold text-slate-900">{query ? `Search results for "${q}"` : "All products"}</h1>
      <p className="mt-1 text-sm text-[var(--color-muted)]">{results.length} products found</p>
      <div className="mt-6">
        <ProductGrid products={results} />
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <SearchInner />
    </Suspense>
  );
}
