"use client";

import Link from "next/link";
import { skipToken } from "@reduxjs/toolkit/query";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useProducts } from "@/context/ProductsContext";
import { useGetSellerOrderQuery } from "@/Redux/api";
import { PageLoader } from "@/components/ui/PageLoader";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { ShipmentEditor } from "@/components/seller/ShipmentEditor";
import { ShipByIndicator } from "@/components/seller/ShipByIndicator";
import { sellerEarnings } from "@/lib/shipping";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function SellerOrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { role, hydrated } = useAuth();
  const { products, loading: productsLoading } = useProducts();
  const { data: order, isLoading } = useGetSellerOrderQuery(role === "seller" ? orderId : skipToken);

  if (!hydrated || isLoading || productsLoading) return <PageLoader />;

  // For a seller the API returns the order with only their store's items (and totals for those items alone).
  const items = role === "seller" && order ? order.items : [];

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
    ["Buyer username", order.buyerUsername],
    ["Buyer name", billing.fullName],
    ["Delivery address", [billing.street, billing.city, billing.province, billing.zipCode].filter(Boolean).join(", ")],
    ["Phone number", [billing.phone1, billing.phone2].filter(Boolean).join(" / ")],
    ...(billing.email ? ([["Email", billing.email]] as [string, string][]) : []),
  ];

  const itemPrice = order.subtotal;
  const shipping = order.deliveryCost;
  const { fee, earnings } = sellerEarnings(itemPrice, shipping);
  const paymentLabel = order.paymentMethod === "cod" ? "Cash on delivery" : "Bank transfer";

  return (
    <div className="container-page space-y-6 py-8">
      <BackLink />
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Order {order.id}</h1>
        <p className="text-sm text-[var(--color-muted)]">Placed {formatDate(order.createdAt)}</p>
      </div>

      <section className="card p-6">
        <h2 className="section-title mb-3">Buyer details</h2>
        <dl className="space-y-1.5 text-sm">
          {details.map(([label, value]) => (
            <div key={label} className="flex gap-2">
              <dt className="w-36 shrink-0 text-[var(--color-muted)]">{label}:</dt>
              <dd className="text-slate-800">{value}</dd>
            </div>
          ))}
          {order.orderNote && (
            <div className="flex gap-2">
              <dt className="w-36 shrink-0 text-[var(--color-muted)]">Buyer note:</dt>
              <dd className="text-slate-800">{order.orderNote}</dd>
            </div>
          )}
        </dl>
      </section>

      <section className="space-y-4">
        <h2 className="section-title">Ordered items</h2>
        {items.map((item) => {
          const product = products.find((p) => p.id === item.productId);
          return (
            <div key={item.id} className="card flex flex-col gap-4 p-6 sm:flex-row sm:justify-between">
              <div className="flex gap-4">
                <PlaceholderImage
                  seed={item.productId}
                  icon={item.icon}
                  image={product?.images?.[0]}
                  label={item.title}
                  className="h-28 w-24 shrink-0 rounded-md"
                />
                <div className="space-y-1 text-sm">
                  <p className="font-medium text-slate-900">{item.title}</p>
                  {item.variation && Object.keys(item.variation).length > 0 && (
                    <div className="font-semibold text-slate-800">
                      {Object.entries(item.variation).map(([name, value]) => (
                        <p key={name}>
                          {name}: {value}
                        </p>
                      ))}
                    </div>
                  )}
                  <p className="text-slate-600">
                    Quantity: {item.quantity} × {formatCurrency(item.price)} = {formatCurrency(item.quantity * item.price)}
                  </p>
                  {item.shippingCost > 0 && <p className="text-slate-600">Shipping: {formatCurrency(item.shippingCost)}</p>}
                  <ShipByIndicator item={item} />
                </div>
              </div>
              <ShipmentEditor
                orderId={order.id}
                itemId={item.id}
                trackingNumber={item.trackingNumber}
                courierName={item.courierName}
              />
            </div>
          );
        })}
      </section>

      <section className="card p-6">
        <h2 className="section-title mb-1">Your earnings</h2>
        <p className="mb-4 text-sm text-slate-600">
          Payment method: <span className="font-medium text-slate-900">{paymentLabel}</span>
        </p>
        <table className="w-full max-w-md text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
              <th className="py-2">Description</th>
              <th className="py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            <tr>
              <td className="py-2 text-slate-700">Item price</td>
              <td className="py-2 text-right text-slate-800">{formatCurrency(itemPrice)}</td>
            </tr>
            <tr>
              <td className="py-2 text-slate-700">Shipping cost</td>
              <td className="py-2 text-right text-slate-800">{formatCurrency(shipping)}</td>
            </tr>
            <tr>
              <td className="py-2 text-slate-700">Website fee (3%)</td>
              <td className="py-2 text-right text-slate-800">− {formatCurrency(fee)}</td>
            </tr>
            <tr>
              <td className="py-2 font-semibold text-slate-900">Actual earnings</td>
              <td className="py-2 text-right font-bold text-slate-900">{formatCurrency(earnings)}</td>
            </tr>
          </tbody>
        </table>
        <p className="mt-3 text-xs text-[var(--color-muted)]">
          Website fee = (item price + shipping cost) × 3%. Actual earnings = item price + shipping cost − website fee.
        </p>
      </section>
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
