"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { User, LogIn } from "lucide-react";
import { getBuyerById } from "@/lib/data/buyers";
import { fetchJson } from "@/lib/fetchJson";
import { useAuth } from "@/context/AuthContext";
import { DeliveryAddressCard } from "@/components/account/DeliveryAddressCard";
import { PurchaseHistoryItem } from "@/components/account/PurchaseHistoryItem";
import { RecentlyViewedSection } from "@/components/home/RecentlyViewedSection";
import { Button } from "@/components/ui/Button";
import { PageLoader } from "@/components/ui/PageLoader";
import { Buyer, Order, Product } from "@/types";

export default function AccountPage() {
  const { role, buyerId, displayName, username } = useAuth();
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchJson<Buyer[]>("/data/buyers.json"),
      fetchJson<Order[]>("/data/orders.json"),
      fetchJson<Product[]>("/data/products.json"),
    ])
      .then(([buyersData, ordersData, productsData]) => {
        setBuyers(buyersData);
        setOrders(ordersData);
        setProducts(productsData);
      })
      .finally(() => setLoading(false));
  }, []);

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

  if (loading) return <PageLoader />;

  const buyer = buyerId ? getBuyerById(buyers, buyerId) : undefined;
  const name = buyer?.name ?? displayName;
  const email = buyer?.email ?? (username ? `${username}@example.com` : "");
  const address = buyer?.address ?? {
    fullName: name,
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
            <h1 className="text-xl font-bold text-slate-900">{name}</h1>
            <p className="text-sm text-[var(--color-muted)]">{email}</p>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <DeliveryAddressCard key={buyerId ?? username ?? "guest"} address={address} />
      </div>

      <section className="mt-6 card p-5">
        <h2 className="section-title mb-2">Purchase history</h2>
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
      </section>

      <div className="mt-6">
        <RecentlyViewedSection products={products} />
      </div>
    </div>
  );
}
