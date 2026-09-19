import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";

export const FLAT_DELIVERY_COST = 350;

export function CartSummary({ subtotal, itemCount }: { subtotal: number; itemCount: number }) {
  const deliveryCost = itemCount > 0 ? FLAT_DELIVERY_COST : 0;
  const total = subtotal + deliveryCost;

  return (
    <div className="card sticky top-24 p-5">
      <h2 className="section-title mb-4">Summary</h2>
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-[var(--color-muted)]">Price</dt>
          <dd className="font-medium text-slate-800">{formatCurrency(subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-[var(--color-muted)]">Delivery cost</dt>
          <dd className="font-medium text-slate-800">{formatCurrency(deliveryCost)}</dd>
        </div>
        <div className="flex justify-between border-t border-[var(--color-border)] pt-2 text-base">
          <dt className="font-semibold text-slate-900">Total</dt>
          <dd className="font-bold text-slate-900">{formatCurrency(total)}</dd>
        </div>
      </dl>
      {itemCount > 0 ? (
        <Link href="/checkout" className="mt-5 block">
          <Button fullWidth size="lg">
            Continue to checkout
          </Button>
        </Link>
      ) : (
        <Button fullWidth size="lg" disabled className="mt-5">
          Continue to checkout
        </Button>
      )}
    </div>
  );
}
