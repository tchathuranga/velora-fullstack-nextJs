"use client";

import { useState } from "react";
import Link from "next/link";
import { skipToken } from "@reduxjs/toolkit/query";
import { notFound, useParams } from "next/navigation";
import { Package, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { getStoreBySlug } from "@/lib/data/stores";
import { getProductsByStore } from "@/lib/data/products";
import { StoreHeader } from "@/components/store/StoreHeader";
import { ListingTab, StoreStats } from "@/components/store/StoreStats";
import { ProductGrid } from "@/components/product/ProductGrid";
import { PageLoader } from "@/components/ui/PageLoader";
import { formatDate } from "@/lib/utils";
import { useProducts } from "@/context/ProductsContext";
import { useStores } from "@/context/StoresContext";
import { useGetMyProductsQuery } from "@/Redux/api";

export default function StoreOverviewPage() {
  const { storeSlug } = useParams<{ storeSlug: string }>();
  const { stores, loading: storesLoading } = useStores();
  const { products, loading: productsLoading } = useProducts();
  const { role, storeSlug: ownStoreSlug } = useAuth();
  const [tab, setTab] = useState<ListingTab>("active");
  const isOwnStore = role === "seller" && ownStoreSlug === storeSlug;
  // The owner also sees their ended (Unsold) listings, which the public catalog hides.
  const { data: myProducts, isLoading: myLoading } = useGetMyProductsQuery(isOwnStore ? undefined : skipToken);

  if (storesLoading || productsLoading || (isOwnStore && myLoading)) return <PageLoader />;

  const store = getStoreBySlug(stores, storeSlug);
  if (!store) notFound();

  const isOwner = isOwnStore;
  const storeProducts = isOwner
    ? (myProducts ?? []).filter((p) => (tab === "active" ? p.status === "active" : p.status === "ended"))
    : getProductsByStore(products, store.id);

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

      <StoreStats
        stats={store.stats}
        selected={tab}
        onSelect={isOwner ? setTab : undefined}
        ordersHref={isOwner ? "/seller/orders" : undefined}
      />

      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="section-title">{isOwner && tab === "unsold" ? "Unsold (ended listings)" : "Products"}</h2>
          {isOwner && (
            <Link href="/seller/products/new">
              <Button variant="accent" size="lg" className="shadow-md hover:shadow-lg">
                <Plus size={20} strokeWidth={2.5} /> List a product
              </Button>
            </Link>
          )}
        </div>
        {isOwner && tab === "unsold" && storeProducts.length === 0 ? (
          <p className="card p-6 text-sm text-[var(--color-muted)]">
            You have no ended listings. Open a product and choose &quot;End Listing&quot; to move it here.
          </p>
        ) : (
          <ProductGrid products={storeProducts} />
        )}
      </section>
    </div>
  );
}
