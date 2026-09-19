"use client";

import { useEffect, useState } from "react";
import { notFound, useParams } from "next/navigation";
import { getStoreBySlug } from "@/lib/data/stores";
import { getProductsByStore } from "@/lib/data/products";
import { fetchJson } from "@/lib/fetchJson";
import { Store, Product } from "@/types";
import { StoreHeader } from "@/components/store/StoreHeader";
import { StoreStats } from "@/components/store/StoreStats";
import { ProductGrid } from "@/components/product/ProductGrid";
import { PageLoader } from "@/components/ui/PageLoader";
import { formatDate } from "@/lib/utils";

export default function StoreOverviewPage() {
  const { storeSlug } = useParams<{ storeSlug: string }>();
  const [stores, setStores] = useState<Store[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchJson<Store[]>("/data/stores.json"), fetchJson<Product[]>("/data/products.json")])
      .then(([storesData, productsData]) => {
        setStores(storesData);
        setProducts(productsData);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  const store = getStoreBySlug(stores, storeSlug);
  if (!store) notFound();

  const storeProducts = getProductsByStore(products, store.id);

  return (
    <div className="container-page space-y-8 py-8">
      <StoreHeader store={store} />

      <section className="card p-6">
        <h2 className="section-title mb-3">About us</h2>
        <dl className="grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">Store Name</dt>
            <dd className="mt-1 text-sm text-slate-800">{store.storeName}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">Created Date</dt>
            <dd className="mt-1 text-sm text-slate-800">{formatDate(store.createdAt)}</dd>
          </div>
          <div className="sm:col-span-3">
            <dt className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">Store Description</dt>
            <dd className="mt-1 text-sm text-slate-800">{store.aboutStore}</dd>
          </div>
        </dl>
      </section>

      <StoreStats stats={store.stats} />

      <section>
        <h2 className="section-title mb-4">Products</h2>
        <ProductGrid products={storeProducts} />
      </section>
    </div>
  );
}
