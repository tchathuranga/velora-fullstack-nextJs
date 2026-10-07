"use client";

import Link from "next/link";
import { skipToken } from "@reduxjs/toolkit/query";
import { User, LogIn, Store } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useProducts } from "@/context/ProductsContext";
import { useGetOrdersQuery } from "@/Redux/api";
import { DeliveryAddressCard } from "@/components/account/DeliveryAddressCard";
import { PurchaseHistoryItem } from "@/components/account/PurchaseHistoryItem";
import { RecentlyViewedSection } from "@/components/home/RecentlyViewedSection";
import { Button } from "@/components/ui/Button";
import { PageLoader } from "@/components/ui/PageLoader";

export default function AccountPage() {
  const { role, hydrated, displayName, email, sellerStoreSlug, address, saveAddress } = useAuth();
  const { products, loading: productsLoading } = useProducts();
  const { data: orders = [], isLoading: ordersLoading } = useGetOrdersQuery(role === "buyer" ? undefined : skipToken);

  if (!hydrated) return <PageLoader />;

  if (role !== "buyer") {
    return (
      <div className="container-page flex min-h-[50vh] flex-col items-center justify-center gap-4 py-16 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          <LogIn size={26} />
        </span>
        <p className="text-slate-600">Log in as a buyer to see your account.</p>
        <Link href="/login">
          <Button>Log in</Button>
        </Link>
      </div>
    );
  }

  if (ordersLoading || productsLoading) return <PageLoader />;

  const deliveryAddress = address ?? {
    fullName: displayName,
    street: "",
    city: "",
    province: "",
    phone1: "",
    phone2: "",
    zipCode: "",
  };

  return (
    <div className="container-page py-8">
      <div className="card overflow-hidden">
        <div className="h-28 bg-gradient-to-br from-indigo-500 to-violet-600 sm:h-36" />
        <div className="flex items-center gap-4 px-6 pb-6">
          <div className="-mt-10 flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-[var(--color-primary)] text-white shadow-md">
            <User size={32} />
          </div>
          <div className="pt-3">
            <h1 className="text-xl font-bold text-slate-900">{displayName}</h1>
            <p className="text-sm text-[var(--color-muted)]">{email}</p>
          </div>
        </div>
      </div>

      {sellerStoreSlug && (
        <div className="mt-6 flex flex-col items-start justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-slate-50 p-5 sm:flex-row sm:items-center">
          <div>
            <p className="font-medium text-slate-900">You&apos;ve applied to become a seller</p>
            <p className="text-sm text-[var(--color-muted)]">Check whether your store has been approved yet.</p>
          </div>
          <Link href="/sell/pending">
            <Button variant="secondary">
              <Store size={16} />
              View seller account status
            </Button>
          </Link>
        </div>
      )}

      <div className="mt-6">
        <DeliveryAddressCard key={address?.street ?? "no-address"} address={deliveryAddress} onSave={saveAddress} />
      </div>

      <section className="mt-6 card p-5">
        <h2 className="section-title mb-2">Purchase history</h2>
        {orders.length === 0 ? (
          <p className="py-4 text-sm text-[var(--color-muted)]">You haven&apos;t placed any orders yet.</p>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {orders.flatMap((order) =>
              order.items.map((item) => (
                <PurchaseHistoryItem
                  key={`${order.id}-${item.productId}`}
                  order={order}
                  item={item}
                  product={products.find((p) => p.id === item.productId)}
                />
              )),
            )}
          </div>
        )}
      </section>

      <div className="mt-6">
        <RecentlyViewedSection products={products} />
      </div>
    </div>
  );
}
