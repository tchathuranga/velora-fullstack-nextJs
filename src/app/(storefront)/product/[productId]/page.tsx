"use client";

import { useState } from "react";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { getRelatedProducts } from "@/lib/data/products";
import { getStoreById } from "@/lib/data/stores";
import { getCategoryById, getSubcategoryById } from "@/lib/data/categories";
import { useGetFeedbackQuery, useGetProductQuery } from "@/Redux/api";
import { useCategories } from "@/context/CategoriesContext";
import { useStores } from "@/context/StoresContext";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductActions } from "@/components/product/ProductActions";
import { SellerListingControls } from "@/components/product/SellerListingControls";
import { ProductViewTracker } from "@/components/product/ProductViewTracker";
import { ProductGrid } from "@/components/product/ProductGrid";
import { FeedbackList } from "@/components/feedback/FeedbackList";
import { ContactSellerButton } from "@/components/store/ContactSellerButton";
import { StarRating } from "@/components/ui/StarRating";
import { PageLoader } from "@/components/ui/PageLoader";
import { useProducts } from "@/context/ProductsContext";
import { useAuth } from "@/context/AuthContext";
import type { VariationCombination } from "@/types";

export default function ProductPreviewPage() {
  const { productId } = useParams<{ productId: string }>();
  const { products, loading: productsLoading } = useProducts();
  const { categories } = useCategories();
  const { stores, loading: storesLoading } = useStores();
  const { role, storeSlug } = useAuth();
  const [pickedVariation, setPickedVariation] = useState<string | null>(null);
  const { data: product, isLoading: productLoading, isError } = useGetProductQuery(productId);
  const { data: feedback = [], isLoading: feedbackLoading } = useGetFeedbackQuery(product?.id ?? "", { skip: !product });

  if (productLoading || productsLoading || storesLoading || feedbackLoading) return <PageLoader />;

  if (isError || !product) notFound();

  const store = getStoreById(stores, product.storeId);
  const category = product.categoryId ? getCategoryById(categories, product.categoryId) : undefined;
  const subcategory = product.subcategoryId ? getSubcategoryById(category, product.subcategoryId) : undefined;
  const related = getRelatedProducts(products, product);
  const isOwner = role === "seller" && !!store && storeSlug === store.slug;

  // The shopper's choice, else the first variation that is in stock (or just the first one when all are sold out).
  const combinations = product.variations?.combinations ?? [];
  const combination: VariationCombination | null =
    combinations.find((c) => c.id === pickedVariation) ?? combinations.find((c) => c.quantity > 0) ?? combinations[0] ?? null;
  const variationImage = combination
    ? Object.values(combination.values)
        .map((option) => product.variations?.images[option])
        .find(Boolean)
    : undefined;

  const specs = [
    product.brand && { label: "Brand", value: product.brand },
    product.condition && { label: "Condition", value: product.condition },
    product.size && { label: "Size", value: product.size },
    product.color && { label: "Color", value: product.color },
    product.packageInclude && { label: "Package include", value: product.packageInclude },
    ...product.customSpecs,
  ].filter((s): s is { label: string; value: string } => Boolean(s));

  return (
    <div className="container-page py-8">
      <ProductViewTracker productId={product.id} />

      <div className="grid gap-10 lg:grid-cols-2">
        <ProductGallery
          productId={product.id}
          icon={product.icon}
          count={product.galleryCount}
          title={product.title}
          images={product.images}
          overrideImage={variationImage}
        />

        <div>
          {category && (
            <p className="mb-1.5 text-xs font-medium text-[var(--color-muted)]">
              <Link href={`/category/${category.slug}`} className="hover:text-[var(--color-primary)] hover:underline">
                {category.name}
              </Link>
              {subcategory && (
                <>
                  {" / "}
                  <Link
                    href={`/category/${category.slug}?sub=${subcategory.slug}`}
                    className="hover:text-[var(--color-primary)] hover:underline"
                  >
                    {subcategory.name}
                  </Link>
                </>
              )}
            </p>
          )}
          <h1 className="text-2xl font-semibold text-slate-900">{product.title}</h1>
          <div className="mt-2 flex items-center gap-3">
            {store && (
              <Link href={`/store/${store.slug}`} className="link-blue text-sm font-medium">
                {store.storeName}
              </Link>
            )}
            <div className="flex items-center gap-1.5">
              <StarRating value={product.rating} readOnly size={14} />
              <span className="text-xs text-[var(--color-muted)]">({product.reviewCount} reviews)</span>
            </div>
          </div>

          {isOwner && (
            <div className="mt-4">
              <SellerListingControls product={product} />
            </div>
          )}

          <div className="mt-4">{store && <ContactSellerButton storeId={store.id} productId={product.id} />}</div>

          <div className="mt-6">
            {product.status === "ended" ? (
              <p className="rounded-lg bg-slate-50 p-4 text-sm text-[var(--color-muted)]">This listing is no longer available for purchase.</p>
            ) : (
              <ProductActions
                key={product.id}
                product={product}
                combination={combination}
                onSelectCombination={setPickedVariation}
              />
            )}
          </div>
        </div>
      </div>

      <section className="mt-12 card p-6">
        <h2 className="section-title mb-4">Specification</h2>
        <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
          {specs.map((spec) => (
            <div key={spec.label} className="flex justify-between border-b border-[var(--color-border)] pb-2 text-sm">
              <dt className="text-[var(--color-muted)]">{spec.label}</dt>
              <dd className="font-medium text-slate-800">{spec.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-8 card p-6">
        <h2 className="section-title mb-4">Description</h2>
        <div
          className="max-w-none text-sm leading-relaxed text-slate-600 [&_blockquote]:border-l-2 [&_blockquote]:border-[var(--color-border)] [&_blockquote]:pl-3 [&_blockquote]:italic [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-slate-800 [&_img]:my-3 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-lg [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-2 [&_ul]:list-disc [&_ul]:pl-5"
          dangerouslySetInnerHTML={{ __html: product.description }}
        />
      </section>

      <section className="mt-12">
        <h2 className="section-title mb-4">Related Items</h2>
        <ProductGrid products={related} />
      </section>

      <section className="mt-12 card p-6">
        <h2 className="section-title mb-4">Feedback for this product</h2>
        <FeedbackList feedback={feedback} />
      </section>
    </div>
  );
}
