import { CartItem } from "@/context/CartContext";
import { formatCurrency } from "@/lib/utils";

export function OrderSummary({
  items,
  subtotal,
  deliveryCost,
}: {
  items: CartItem[];
  subtotal: number;
  deliveryCost: number;
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
        {items.map((item) => (
          <li key={item.productId} className="flex justify-between py-3 text-sm">
            <span className="text-slate-700">
              {item.title} <span className="text-[var(--color-muted)]">× {item.quantity}</span>
            </span>
            <span className="font-medium text-slate-800">{formatCurrency(item.price * item.quantity)}</span>
          </li>
        ))}
      </ul>
      <div className="space-y-2 border-t border-[var(--color-border)] pt-3 text-sm">
        <div className="flex justify-between">
          <span className="text-[var(--color-muted)]">Delivery cost</span>
          <span className="font-medium text-slate-800">{formatCurrency(deliveryCost)}</span>
        </div>
        <div className="flex justify-between text-base">
          <span className="font-semibold text-slate-900">Total</span>
          <span className="font-bold text-slate-900">{formatCurrency(total)}</span>
        </div>
      </div>
    </div>
  );
}
