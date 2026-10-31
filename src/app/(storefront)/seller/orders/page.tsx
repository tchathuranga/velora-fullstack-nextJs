"use client";

import Link from "next/link";
import { skipToken } from "@reduxjs/toolkit/query";
import { useAuth } from "@/context/AuthContext";
import { useProducts } from "@/context/ProductsContext";
import { useGetSellerOrdersQuery } from "@/Redux/api";
import { PageLoader } from "@/components/ui/PageLoader";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { ShipmentEditor } from "@/components/seller/ShipmentEditor";
import { ShipByIndicator } from "@/components/seller/ShipByIndicator";
import { formatCurrency, formatDate, statusLabel } from "@/lib/utils";

export default function SellerOrdersPage() {
  const { role, hydrated } = useAuth();
  const { products, loading: productsLoading } = useProducts();
  const { data: orders = [], isLoading } = useGetSellerOrdersQuery(role === "seller" ? undefined : skipToken);

  if (!hydrated || isLoading || productsLoading) return <PageLoader />;

  return (
    <div className="container-page space-y-6 py-8">
      <h1 className="text-2xl font-bold text-slate-900">Manage orders</h1>

      {orders.length === 0 ? (
        <p className="card p-6 text-sm text-[var(--color-muted)]">No orders for your store yet.</p>
      ) : (
        <ul className="space-y-4">
          {/* The API already returns only this store's items on each order. */}
          {orders.map((order) => (
            <li key={order.id} className="card p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <Link href={`/seller/orders/${order.id}`} className="text-sm font-semibold text-[var(--color-primary)] hover:underline">
                  Order ID: {order.id}
                </Link>
                <span className="text-xs text-[var(--color-muted)]">
                  {formatDate(order.createdAt)} · {statusLabel(order.status)} · {formatCurrency(order.total)}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-600">
                Buyer: <span className="font-medium text-slate-800">{order.buyerUsername}</span>
              </p>

              <ul className="mt-3 divide-y divide-[var(--color-border)]">
                {order.items.map((item) => {
                  const product = products.find((p) => p.id === item.productId);
                  return (
                    <li key={item.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex gap-3">
                        <PlaceholderImage
                          seed={item.productId}
                          icon={item.icon}
                          image={product?.images?.[0]}
                          label={item.title}
                          className="h-20 w-16 shrink-0 rounded-md"
                        />
                        <div className="text-sm">
                          {product ? (
                            <Link href={`/product/${product.slug}`} className="text-slate-800 hover:text-[var(--color-primary)] hover:underline">
                              {item.title}
                            </Link>
                          ) : (
                            <p className="text-slate-800">{item.title}</p>
                          )}
                          {item.variation && <p className="text-xs text-[var(--color-muted)]">{Object.values(item.variation).join(" / ")}</p>}
                          <p className="text-xs text-[var(--color-muted)]">Qty {item.quantity}</p>
                          <div className="mt-1">
                            <ShipByIndicator item={item} />
                          </div>
                        </div>
                      </div>
                      <ShipmentEditor
                        orderId={order.id}
                        itemId={item.id}
                        trackingNumber={item.trackingNumber}
                        courierName={item.courierName}
                      />
                    </li>
                  );
                })}
              </ul>

              <div className="mt-2 text-right">
                <Link href={`/seller/orders/${order.id}`} className="text-sm font-medium text-[var(--color-primary)] hover:underline">
                  View order details
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
