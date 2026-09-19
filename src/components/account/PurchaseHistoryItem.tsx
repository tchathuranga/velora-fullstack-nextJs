"use client";

import { useState } from "react";
import Link from "next/link";
import { Order, OrderItem, Product } from "@/types";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { Modal } from "@/components/ui/Modal";
import { TrackingSteps } from "@/components/account/TrackingSteps";
import { FeedbackForm } from "@/components/feedback/FeedbackForm";
import { formatCurrency, formatDate } from "@/lib/utils";

export function PurchaseHistoryItem({
  order,
  item,
  product,
}: {
  order: Order;
  item: OrderItem;
  product?: Product;
}) {
  const [trackingOpen, setTrackingOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  return (
    <div className="flex gap-4 py-5">
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg">
        <PlaceholderImage seed={item.productId} icon={item.icon} className="h-full w-full" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          {product ? (
            <Link href={`/product/${product.slug}`} className="font-semibold text-slate-900 hover:text-[var(--color-primary)]">
              {item.title}
            </Link>
          ) : (
            <p className="font-semibold text-slate-900">{item.title}</p>
          )}
          <span className="text-xs text-[var(--color-muted)]">Ordered {formatDate(order.createdAt)}</span>
        </div>
        <p className="text-sm text-[var(--color-muted)]">
          Qty {item.quantity} · {formatCurrency(item.price)} each
        </p>
        <div className="my-2 border-t border-dashed border-[var(--color-border)]" />
        <div className="flex gap-4 text-sm">
          <button type="button" onClick={() => setTrackingOpen(true)} className="link-blue font-medium">
            View tracking
          </button>
          <button type="button" onClick={() => setFeedbackOpen(true)} className="link-blue font-medium">
            Leave feedback
          </button>
        </div>
      </div>

      <Modal open={trackingOpen} onClose={() => setTrackingOpen(false)} title="Tracking information">
        <TrackingSteps order={order} />
      </Modal>

      <Modal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} title="Leave feedback">
        <FeedbackForm productTitle={item.title} onSubmit={() => {}} />
      </Modal>
    </div>
  );
}
