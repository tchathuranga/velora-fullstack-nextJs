import { Minus, Plus } from "lucide-react";
import { CheckoutLine } from "@/lib/checkout";
import { estimateDelivery, formatEstimate } from "@/lib/shipping";
import { formatCurrency } from "@/lib/utils";

export function OrderSummary({
  lines,
  subtotal,
  deliveryCost,
  onQuantityChange,
}: {
  lines: CheckoutLine[];
  subtotal: number;
  deliveryCost: number;
  /** Buyers can change quantities right here; the totals below follow immediately. */
  onQuantityChange: (line: CheckoutLine, quantity: number) => void;
}) {
  const total = subtotal + deliveryCost;

  return (
    <div className="card p-5">
      <h2 className="section-title mb-4">Your order</h2>
      <div className="flex justify-between border-b border-[var(--color-border)] pb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
        <span>Product</span>
        <span>Subtotal</span>
      </div>
      <ul className="divide-y divide-[var(--color-border)]">
        {lines.map((line) => {
          const estimate = estimateDelivery(line.handlingTime, line.deliveryTime);
          const max = Math.max(line.stock, 1);
          return (
            <li key={line.key} className="py-3 text-sm">
              <div className="flex justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-slate-700">{line.title}</p>
                  {line.variation && (
                    <p className="text-xs text-[var(--color-muted)]">{Object.values(line.variation).join(" / ")}</p>
                  )}
                  <p className="text-xs text-[var(--color-muted)]">{formatCurrency(line.price)} each</p>
                </div>
                <span className="shrink-0 font-medium text-slate-800">{formatCurrency(line.price * line.quantity)}</span>
              </div>

              <div className="mt-2 flex items-center gap-3">
                <div className="flex items-center rounded-lg border border-[var(--color-border)]">
                  <button
                    type="button"
                    onClick={() => onQuantityChange(line, line.quantity - 1)}
                    disabled={line.quantity <= 1}
                    className="flex h-8 w-8 items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                    aria-label={`Decrease quantity of ${line.title}`}
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-8 text-center text-sm font-medium">{line.quantity}</span>
                  <button
                    type="button"
                    onClick={() => onQuantityChange(line, line.quantity + 1)}
                    disabled={line.quantity >= max}
                    className="flex h-8 w-8 items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                    aria-label={`Increase quantity of ${line.title}`}
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <span className="text-xs text-[var(--color-muted)]">{line.stock} available</span>
              </div>

              {line.unavailable ? (
                <p className="mt-1 text-xs font-medium text-[var(--color-danger)]">This item is no longer available.</p>
              ) : line.stock === 0 ? (
                <p className="mt-1 text-xs font-medium text-[var(--color-danger)]">Out of stock</p>
              ) : line.quantity > line.stock ? (
                <p className="mt-1 text-xs font-medium text-[var(--color-danger)]">Only {line.stock} left — please lower the quantity.</p>
              ) : null}

              {estimate && (
                <p className="mt-1 text-xs text-[var(--color-muted)]">
                  {formatEstimate(estimate).by} ({formatEstimate(estimate).within.toLowerCase()})
                </p>
              )}
            </li>
          );
        })}
      </ul>
      <div className="space-y-2 border-t border-[var(--color-border)] pt-3 text-sm">
        <div className="flex justify-between">
          <span className="text-[var(--color-muted)]">Subtotal</span>
          <span className="font-medium text-slate-800">{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--color-muted)]">Shipping</span>
          <span className="font-medium text-slate-800">{deliveryCost === 0 && lines.length > 0 ? "Free Shipping" : formatCurrency(deliveryCost)}</span>
        </div>
        <div className="flex justify-between text-base">
          <span className="font-semibold text-slate-900">Total</span>
          <span className="font-bold text-slate-900">{formatCurrency(total)}</span>
        </div>
      </div>
    </div>
  );
}
