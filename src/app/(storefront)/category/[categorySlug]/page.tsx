"use client";

import { Suspense } from "react";
import Link from "next/link";
import { notFound, useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import clsx from "clsx";
import { useCategories } from "@/context/CategoriesContext";
import { useProducts } from "@/context/ProductsContext";
import { getCategoryBySlug } from "@/lib/data/categories";
import { ProductGrid } from "@/components/product/ProductGrid";
import { PageLoader } from "@/components/ui/PageLoader";

function CategoryInner() {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const subSlug = searchParams.get("sub");

  const { categories, loading: categoriesLoading } = useCategories();
  const { products, loading: productsLoading } = useProducts();

  if (categoriesLoading || productsLoading) return <PageLoader />;

  const category = getCategoryBySlug(categories, categorySlug);
  if (!category) notFound();

  const activeSub = subSlug ? category.subcategories.find((s) => s.slug === subSlug) : undefined;
  const categoryProducts = products.filter((p) => p.categoryId === category.id);
  const results = activeSub ? categoryProducts.filter((p) => p.subcategoryId === activeSub.id) : categoryProducts;

  return (
    <div className="container-page py-8">
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-primary)]"
      >
        <ArrowLeft size={16} />
        Back to home
      </Link>
      <h1 className="text-2xl font-bold text-slate-900">{category.name}</h1>
      <p className="mt-1 text-sm text-[var(--color-muted)]">{results.length} products found</p>

      {category.subcategories.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => router.push(`/category/${category.slug}`)}
            className={clsx(
              "rounded-full border px-3 py-1.5 text-sm font-medium transition",
              !activeSub
                ? "border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)]"
                : "border-[var(--color-border)] text-slate-600 hover:bg-slate-50",
            )}
          >
            All
          </button>
          {category.subcategories.map((sub) => (
            <button
              key={sub.id}
              type="button"
              onClick={() => router.push(`/category/${category.slug}?sub=${sub.slug}`)}
              className={clsx(
                "rounded-full border px-3 py-1.5 text-sm font-medium transition",
                activeSub?.id === sub.id
                  ? "border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)]"
                  : "border-[var(--color-border)] text-slate-600 hover:bg-slate-50",
              )}
            >
              {sub.name}
            </button>
          ))}
        </div>
      )}

      <div className="mt-6">
        <ProductGrid products={results} />
      </div>
    </div>
  );
}

export default function CategoryPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <CategoryInner />
    </Suspense>
  );
}
