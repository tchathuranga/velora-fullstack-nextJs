"use client";

import Link from "next/link";
import { skipToken } from "@reduxjs/toolkit/query";
import { useAuth } from "@/context/AuthContext";
import { useProducts } from "@/context/ProductsContext";
import { useGetSellerOrdersQuery } from "@/Redux/api";
import { PageLoader } from "@/components/ui/PageLoader";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { TrackingNumberEditor } from "@/components/seller/TrackingNumberEditor";

export default function SellerOrdersPage() {
  const { role, hydrated } = useAuth();
  const { products, loading: productsLoading } = useProducts();
  const { data: orders = [], isLoading } = useGetSellerOrdersQuery(role === "seller" ? undefined : skipToken);

  if (!hydrated || isLoading || productsLoading) return <PageLoader />;

  // The API already returns only this store's items on each order.
  const lines = orders.flatMap((order) => order.items.map((item) => ({ order, item })));

  return (
    <div className="container-page space-y-6 py-8">
      <h1 className="text-2xl font-bold text-slate-900">Orders</h1>

      {lines.length === 0 ? (
        <p className="card p-6 text-sm text-[var(--color-muted)]">No orders for your store yet.</p>
      ) : (
        <ul className="space-y-4">
          {lines.map(({ order, item }) => {
            const product = products.find((p) => p.id === item.productId);
            return (
              <li key={`${order.id}:${item.productId}`} className="card p-4">
                <PlaceholderImage
                  seed={item.productId}
                  icon={item.icon}
                  image={product?.images?.[0]}
                  label={item.title}
                  className="h-28 w-24 rounded-md"
                />
                <Link
                  href={`/seller/orders/${order.id}`}
                  className="mt-2 inline-block text-sm font-semibold text-[var(--color-primary)] hover:underline"
                >
                  Order ID: {order.id}
                </Link>
                <div className="mt-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <p className="text-sm text-slate-800">{item.title}</p>
                  <TrackingNumberEditor orderId={order.id} productId={item.productId} trackingNumber={item.trackingNumber} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
