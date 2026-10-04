"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { getProductBySlug, getRelatedProducts } from "@/lib/data/products";
import { getStoreById } from "@/lib/data/stores";
import { getCategoryById, getSubcategoryById } from "@/lib/data/categories";
import { getFeedbackForProduct } from "@/lib/data/feedback";
import { fetchJson } from "@/lib/fetchJson";
import { Feedback } from "@/types";
import { useCategories } from "@/context/CategoriesContext";
import { useStores } from "@/context/StoresContext";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductActions } from "@/components/product/ProductActions";
import { ProductViewTracker } from "@/components/product/ProductViewTracker";
import { ProductGrid } from "@/components/product/ProductGrid";
import { FeedbackList } from "@/components/feedback/FeedbackList";
import { ContactSellerButton } from "@/components/store/ContactSellerButton";
import { StarRating } from "@/components/ui/StarRating";
import { PageLoader } from "@/components/ui/PageLoader";
import { useProducts } from "@/context/ProductsContext";

export default function ProductPreviewPage() {
  const { productId } = useParams<{ productId: string }>();
  const [feedbackEntries, setFeedbackEntries] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const { products, loading: productsLoading } = useProducts();
  const { categories } = useCategories();
  const { stores, loading: storesLoading } = useStores();

  useEffect(() => {
    fetchJson<Feedback[]>("/data/feedback.json")
      .then(setFeedbackEntries)
      .finally(() => setLoading(false));
  }, []);

  if (loading || productsLoading || storesLoading) return <PageLoader />;

  const product = getProductBySlug(products, productId);
  if (!product) notFound();

  const store = getStoreById(stores, product.storeId);
  const category = product.categoryId ? getCategoryById(categories, product.categoryId) : undefined;
  const subcategory = product.subcategoryId ? getSubcategoryById(category, product.subcategoryId) : undefined;
  const related = getRelatedProducts(products, product);
  const feedback = getFeedbackForProduct(feedbackEntries, product.id);

  const specs = [
    product.brand && { label: "Brand", value: product.brand },
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

          <div className="mt-4">{store && <ContactSellerButton storeId={store.id} />}</div>

          <div className="mt-6">
            <ProductActions product={product} />
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 rounded-lg bg-slate-50 p-4 text-sm">
            <div>
              <p className="text-[var(--color-muted)]">Handling time</p>
              <p className="font-medium text-slate-800">{product.handlingTime}</p>
            </div>
            <div>
              <p className="text-[var(--color-muted)]">Deliver by</p>
              <p className="font-medium text-slate-800">{product.deliveryTime}</p>
            </div>
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
          className="max-w-none text-sm leading-relaxed text-slate-600 [&_blockquote]:border-l-2 [&_blockquote]:border-[var(--color-border)] [&_blockquote]:pl-3 [&_blockquote]:italic [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-slate-800 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-2 [&_ul]:list-disc [&_ul]:pl-5"
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
