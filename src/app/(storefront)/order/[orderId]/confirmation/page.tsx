"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Mail, Phone, MessageCircle } from "lucide-react";
import { Order, SiteConfig } from "@/types";
import { getStoredOrder } from "@/lib/orderStorage";
import { fetchJson } from "@/lib/fetchJson";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { PageLoader } from "@/components/ui/PageLoader";

export default function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = use(params);
  const searchParams = useSearchParams();
  const [order, setOrder] = useState<Order | null | undefined>(undefined);
  const [site, setSite] = useState<SiteConfig | null>(null);

  useEffect(() => {
    // Order details live in sessionStorage (browser-only) with the seed orders.json as a fallback
    // for direct/demo links, and site.json holds the contact/bank info — all loaded client-side.
    fetchJson<Order[]>("/data/orders.json")
      .then((fallbackOrders) => {
        setOrder(getStoredOrder(orderId, fallbackOrders) ?? null);
      })
      .catch(() => setOrder(getStoredOrder(orderId) ?? null));
    fetchJson<SiteConfig>("/data/site.json").then(setSite);
  }, [orderId]);

  const method = searchParams.get("method") ?? order?.paymentMethod ?? "cod";

  if (order === undefined || !site) return <PageLoader />;

  if (order === null) {
    return (
      <div className="container-page flex min-h-[50vh] flex-col items-center justify-center gap-4 py-16 text-center">
        <p className="text-slate-600">We couldn&apos;t find that order.</p>
        <Link href="/">
          <Button>Back to home</Button>
        </Link>
      </div>
    );
  }

  const { siteContact, adminBankAccounts } = site;

  return (
    <div className="container-page max-w-2xl py-12">
      <div className="card p-8 text-center">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-success-light)] text-[var(--color-success)]">
          <CheckCircle2 size={28} />
        </span>
        <h1 className="text-2xl font-bold text-slate-900">Your Order Has Been Successfully Received!</h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Thank you for your order! Order ID: <span className="font-semibold text-slate-700">{order.id}</span>
        </p>

        {method === "cod" ? (
          <div className="mt-6 space-y-3 text-left">
            <p className="text-sm text-slate-600">
              We will prepare your order and hand it over to the delivery service as soon as possible.
            </p>
            <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
              <strong>Payment Method:</strong> Cash on Delivery
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-4 text-left">
            <h2 className="text-base font-semibold text-slate-900">Bank Transfer Instructions</h2>
            <p className="text-sm text-slate-600">
              Please transfer the total order amount to one of the bank accounts below.
            </p>
            <p className="rounded-lg bg-[var(--color-warning-light)] p-3 text-sm text-[var(--color-warning)]">
              <strong>Important:</strong> Please use your Order ID (<strong>{order.id}</strong>) as the payment
              reference when making the bank transfer.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {adminBankAccounts.map((bank) => (
                <div key={bank.label} className="rounded-lg border border-[var(--color-border)] p-4 text-sm">
                  <p className="mb-2 font-semibold text-slate-900">{bank.label}</p>
                  <p className="text-slate-600">Bank Name: {bank.bankName}</p>
                  <p className="text-slate-600">Account Name: {bank.accountName}</p>
                  <p className="text-slate-600">Account Number: {bank.accountNumber}</p>
                  <p className="text-slate-600">Branch: {bank.branch}</p>
                </div>
              ))}
            </div>
            <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
              <p className="mb-2 font-semibold text-slate-900">After Payment</p>
              <p>
                After completing the bank transfer, please send your payment receipt to our WhatsApp number:{" "}
                <span className="font-medium">{siteContact.whatsapp}</span>
              </p>
            </div>
          </div>
        )}

        <div className="mt-6 space-y-2 rounded-lg bg-slate-50 p-4 text-left text-sm">
          <p className="flex items-center gap-2 text-slate-700">
            <Mail size={16} className="text-[var(--color-muted)]" /> {siteContact.email}
          </p>
          <p className="flex items-center gap-2 text-slate-700">
            <Phone size={16} className="text-[var(--color-muted)]" /> {siteContact.phone}
          </p>
          <p className="flex items-center gap-2 text-slate-700">
            <MessageCircle size={16} className="text-[var(--color-muted)]" /> {siteContact.whatsapp}
          </p>
        </div>

        <div className="mt-6 flex justify-between rounded-lg border border-[var(--color-border)] p-4 text-sm">
          <span className="text-[var(--color-muted)]">Order total</span>
          <span className="font-bold text-slate-900">{formatCurrency(order.total)}</span>
        </div>

        <p className="mt-6 text-sm text-slate-600">Thank you for choosing EDEELZ.lk!</p>

        <div className="mt-6 flex justify-center gap-3">
          <Link href="/account">
            <Button variant="outline">View my orders</Button>
          </Link>
          <Link href="/">
            <Button>Continue shopping</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
