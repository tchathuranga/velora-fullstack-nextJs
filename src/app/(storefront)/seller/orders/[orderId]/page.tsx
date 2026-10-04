"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Order } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { useStores } from "@/context/StoresContext";
import { useProducts } from "@/context/ProductsContext";
import { getStoreBySlug } from "@/lib/data/stores";
import { fetchJson } from "@/lib/fetchJson";
import { getStoredOrder } from "@/lib/orderStorage";
import { trackingKey } from "@/lib/trackingStorage";
import { PageLoader } from "@/components/ui/PageLoader";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { TrackingNumberEditor } from "@/components/seller/TrackingNumberEditor";

export default function SellerOrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { storeSlug } = useAuth();
  const { stores, loading: storesLoading } = useStores();
  const { products, loading: productsLoading } = useProducts();
  const [order, setOrder] = useState<Order | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJson<Order[]>("/data/orders.json")
      .then((seed) => setOrder(getStoredOrder(orderId, seed)))
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading || storesLoading || productsLoading) return <PageLoader />;

  const store = storeSlug ? getStoreBySlug(stores, storeSlug) : undefined;
  const items = order && store ? order.items.filter((item) => item.storeId === store.id) : [];

  if (!order || items.length === 0) {
    return (
      <div className="container-page space-y-4 py-8">
        <p className="card p-6 text-sm text-[var(--color-muted)]">Order not found for your store.</p>
        <BackLink />
      </div>
    );
  }

  const { billing } = order;
  const details: [string, string][] = [
    ["Name", billing.fullName],
    ["Address/Street", billing.street],
    ["City", billing.city],
    ["Province", billing.province],
    ["Phone number", billing.phone1],
  ];

  return (
    <div className="container-page space-y-6 py-8">
      <BackLink />
      <h1 className="text-2xl font-bold text-slate-900">Order {order.id}</h1>

      <section className="card p-6">
        <h2 className="section-title mb-3">Buyer delivery information</h2>
        <dl className="space-y-1.5 text-sm">
          {details.map(([label, value]) => (
            <div key={label} className="flex gap-2">
              <dt className="w-36 shrink-0 text-[var(--color-muted)]">{label}:</dt>
              <dd className="text-slate-800">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {items.map((item) => {
        const product = products.find((p) => p.id === item.productId);
        return (
          <section key={item.productId} className="card space-y-3 p-6">
            <PlaceholderImage
              seed={item.productId}
              icon={item.icon}
              image={product?.images?.[0]}
              label={item.title}
              className="h-36 w-32 rounded-md"
            />
            <p className="font-medium text-slate-900">{item.title}</p>
            {item.variation && Object.keys(item.variation).length > 0 && (
              <div className="space-y-0.5 text-sm font-semibold text-slate-800">
                {Object.entries(item.variation).map(([name, value]) => (
                  <p key={name}>
                    {name}: {value}
                  </p>
                ))}
              </div>
            )}
            <TrackingNumberEditor trackingKey={trackingKey(order.id, item.productId)} />
          </section>
        );
      })}
    </div>
  );
}

function BackLink() {
  return (
    <Link href="/seller/orders" className="inline-flex items-center gap-1 text-sm text-[var(--color-primary)] hover:underline">
      <ArrowLeft size={16} /> Back to orders
    </Link>
  );
}
