"use client";

import Link from "next/link";
import { CheckCircle2, Clock3, Mail, Phone, ShieldAlert, XCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useStores } from "@/context/StoresContext";
import { getStoreBySlug } from "@/lib/data/stores";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PageLoader } from "@/components/ui/PageLoader";
import { statusLabel } from "@/lib/utils";
import { SellerStatus } from "@/types";

const STATUS_TONE: Record<SellerStatus, "success" | "danger" | "warning"> = {
  active: "success",
  rejected: "danger",
  limited: "danger",
  under_review: "warning",
};

const STATUS_ICON: Record<SellerStatus, typeof Clock3> = {
  active: CheckCircle2,
  rejected: XCircle,
  limited: ShieldAlert,
  under_review: Clock3,
};

const STATUS_ICON_CLASSES: Record<SellerStatus, string> = {
  active: "bg-[var(--color-success-light)] text-[var(--color-success)]",
  under_review: "bg-[var(--color-warning-light)] text-[var(--color-warning)]",
  rejected: "bg-[var(--color-danger-light)] text-[var(--color-danger)]",
  limited: "bg-[var(--color-danger-light)] text-[var(--color-danger)]",
};

const STATUS_COPY: Record<SellerStatus, { title: string; message: string }> = {
  under_review: {
    title: "Your store is under review",
    message:
      "Thank you for creating a store on won.lk. Our team will review your store and notify you of the outcome within 24 hours.",
  },
  active: {
    title: "Your store is approved!",
    message: "Congratulations — your store is live and ready to sell. Head over to your store to start listing products.",
  },
  rejected: {
    title: "Your store application was declined",
    message: "Unfortunately your store application didn't meet our requirements. Contact support below for details.",
  },
  limited: {
    title: "Your store access is limited",
    message: "Access to your store has been limited by our team. Contact support below to resolve this.",
  },
};

export default function SellStatusPage() {
  const { storeSlug, sellerStoreSlug, hydrated } = useAuth();
  const { stores, loading } = useStores();

  if (!hydrated || loading) return <PageLoader />;

  // Works whether the account is currently signed in as the approved seller (storeSlug) or still
  // as a buyer with a pending/rejected application (sellerStoreSlug).
  const slug = storeSlug ?? sellerStoreSlug;
  const store = slug ? getStoreBySlug(stores, slug) : undefined;

  if (!store) {
    return (
      <div className="container-page flex min-h-[60vh] flex-col items-center justify-center gap-4 py-16 text-center">
        <p className="text-slate-600">Log in with your seller account to check your store&apos;s status.</p>
        <Link href="/login">
          <Button>Log in</Button>
        </Link>
      </div>
    );
  }

  const Icon = STATUS_ICON[store.status];
  const copy = STATUS_COPY[store.status];

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-16">
      <div className="card w-full max-w-lg p-8 text-center">
        <span
          className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${STATUS_ICON_CLASSES[store.status]}`}
        >
          <Icon size={26} />
        </span>
        <h1 className="text-xl font-bold text-slate-900">{copy.title}</h1>
        <div className="mt-2 flex justify-center">
          <Badge tone={STATUS_TONE[store.status]}>{statusLabel(store.status)}</Badge>
        </div>

        <p className="mt-4 text-sm text-slate-600">Dear {store.fullName},</p>
        <p className="mt-2 text-sm text-slate-600">{copy.message}</p>

        {store.status === "active" ? (
          <Link href={`/store/${store.slug}`} className="mt-6 inline-block">
            <Button>Go to my store</Button>
          </Link>
        ) : (
          <div className="mt-6 space-y-2 rounded-lg bg-slate-50 p-4 text-left text-sm">
            <p className="flex items-center gap-2 text-slate-700">
              <Mail size={16} className="text-[var(--color-muted)]" /> support@won.lk
            </p>
            <p className="flex items-center gap-2 text-slate-700">
              <Phone size={16} className="text-[var(--color-muted)]" /> +94 11 234 5678
            </p>
          </div>
        )}

        <p className="mt-6 text-sm font-medium text-slate-800">
          Best regards, <br /> won.lk Team
        </p>
      </div>
    </div>
  );
}
