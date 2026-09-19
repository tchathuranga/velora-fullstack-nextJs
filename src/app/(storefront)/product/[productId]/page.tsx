"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { getProductBySlug, getRelatedProducts } from "@/lib/data/products";
import { getStoreById } from "@/lib/data/stores";
import { getFeedbackForProduct } from "@/lib/data/feedback";
import { fetchJson } from "@/lib/fetchJson";
import { Product, Store, Feedback } from "@/types";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductActions } from "@/components/product/ProductActions";
import { ProductViewTracker } from "@/components/product/ProductViewTracker";
import { ProductGrid } from "@/components/product/ProductGrid";
import { FeedbackList } from "@/components/feedback/FeedbackList";
import { ContactSellerButton } from "@/components/store/ContactSellerButton";
import { StarRating } from "@/components/ui/StarRating";
import { PageLoader } from "@/components/ui/PageLoader";

export default function ProductPreviewPage() {
  const { productId } = useParams<{ productId: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [feedbackEntries, setFeedbackEntries] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchJson<Product[]>("/data/products.json"),
      fetchJson<Store[]>("/data/stores.json"),
      fetchJson<Feedback[]>("/data/feedback.json"),
    ])
      .then(([productsData, storesData, feedbackData]) => {
        setProducts(productsData);
        setStores(storesData);
        setFeedbackEntries(feedbackData);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  const product = getProductBySlug(products, productId);
  if (!product) notFound();

  const store = getStoreById(stores, product.storeId);
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
        <ProductGallery productId={product.id} icon={product.icon} count={product.galleryCount} title={product.title} />

        <div>
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
        <p className="text-sm leading-relaxed text-slate-600">{product.description}</p>
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
