"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil, RotateCcw, XCircle } from "lucide-react";
import { Product } from "@/types";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { getErrorMessage, useSetProductStatusMutation } from "@/Redux/api";

/** Shown on the product page to the seller who owns the listing: edit it, end it (→ Unsold) or relist an ended one. */
export function SellerListingControls({ product }: { product: Product }) {
  const [setStatus, { isLoading }] = useSetProductStatusMutation();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState("");
  const ended = product.status === "ended";

  const change = async (status: "active" | "ended") => {
    setError("");
    try {
      await setStatus({ slug: product.slug, status }).unwrap();
      setConfirmOpen(false);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-slate-50 p-4">
      <p className="text-sm font-semibold text-slate-900">Seller tools</p>
      {ended ? (
        <p className="mt-1 text-sm text-[var(--color-danger)]">
          This listing has ended. It is in your Unsold section and is not visible to buyers.
        </p>
      ) : (
        <p className="mt-1 text-sm text-[var(--color-muted)]">This is how buyers see your listing.</p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <Link href={`/seller/products/${product.slug}/edit`}>
          <Button size="sm" variant="outline">
            <Pencil size={14} /> Edit Listing
          </Button>
        </Link>
        {ended ? (
          <Button size="sm" onClick={() => change("active")} disabled={isLoading}>
            <RotateCcw size={14} /> {isLoading ? "Relisting…" : "Relist"}
          </Button>
        ) : (
          <Button size="sm" variant="outline" onClick={() => setConfirmOpen(true)}>
            <XCircle size={14} /> End Listing
          </Button>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-[var(--color-danger)]">{error}</p>}

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="End this listing?">
        <p className="text-sm text-slate-600">
          &quot;{product.title}&quot; will move to your Unsold section and buyers will no longer be able to find or buy it. You can
          edit or relist it at any time.
        </p>
        {error && <p className="mt-2 text-sm text-[var(--color-danger)]">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setConfirmOpen(false)}>
            Keep listing
          </Button>
          <Button variant="danger" onClick={() => change("ended")} disabled={isLoading}>
            {isLoading ? "Ending…" : "End listing"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
