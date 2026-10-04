"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { Package, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { getStoreBySlug } from "@/lib/data/stores";
import { getProductsByStore } from "@/lib/data/products";
import { StoreHeader } from "@/components/store/StoreHeader";
import { StoreStats } from "@/components/store/StoreStats";
import { ProductGrid } from "@/components/product/ProductGrid";
import { PageLoader } from "@/components/ui/PageLoader";
import { formatDate } from "@/lib/utils";
import { useProducts } from "@/context/ProductsContext";
import { useStores } from "@/context/StoresContext";

export default function StoreOverviewPage() {
  const { storeSlug } = useParams<{ storeSlug: string }>();
  const { stores, loading: storesLoading } = useStores();
  const { products, loading: productsLoading } = useProducts();
  const { role, storeSlug: ownStoreSlug } = useAuth();

  if (storesLoading || productsLoading) return <PageLoader />;

  const store = getStoreBySlug(stores, storeSlug);
  if (!store) notFound();

  const storeProducts = getProductsByStore(products, store.id);
  const isOwner = role === "seller" && ownStoreSlug === store.slug;

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

      {isOwner && (
        <div className="flex justify-end">
          <Link href="/seller/orders">
            <Button variant="outline">
              <Package size={18} /> Manage orders
            </Button>
          </Link>
        </div>
      )}

      <StoreStats stats={store.stats} />

      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="section-title">Products</h2>
          {isOwner && (
            <Link href="/seller/products/new">
              <Button variant="accent" size="lg" className="shadow-md hover:shadow-lg">
                <Plus size={20} strokeWidth={2.5} /> List a product
              </Button>
            </Link>
          )}
        </div>
        <ProductGrid products={storeProducts} />
      </section>
    </div>
  );
}
