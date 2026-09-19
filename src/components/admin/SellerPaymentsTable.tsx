import clsx from "clsx";
import { SellerTransaction } from "@/types";
import { calcTransactionFee, calcNetSale, formatCurrency } from "@/lib/utils";

export function SellerPaymentsTable({
  transactions,
  onToggleConfirm,
}: {
  transactions: SellerTransaction[];
  onToggleConfirm: (id: string) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-[var(--color-border)]">
      <table className="w-full min-w-[40rem] text-sm">
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
          <tr>
            <th className="px-4 py-3">Product title</th>
            <th className="px-4 py-3">Payment method</th>
            <th className="px-4 py-3">Confirm</th>
            <th className="px-4 py-3">Amount</th>
            <th className="px-4 py-3">Transaction fee</th>
            <th className="px-4 py-3">Net sale</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-border)]">
          {transactions.map((tx) => (
            <tr key={tx.id}>
              <td className="px-4 py-3 font-medium text-slate-800">{tx.productTitle}</td>
              <td className="px-4 py-3 text-slate-600">
                {tx.paymentMethod === "bank_transfer" ? "Bank transfer" : "Cash on delivery"}
              </td>
              <td className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => onToggleConfirm(tx.id)}
                  className={clsx(
                    "rounded-md border px-2.5 py-1 text-xs font-semibold",
                    tx.confirmed
                      ? "border-[var(--color-success)] bg-[var(--color-success-light)] text-[var(--color-success)]"
                      : "border-[var(--color-border)] text-slate-500 hover:border-slate-400",
                  )}
                >
                  {tx.confirmed ? "Paid" : "Mark received"}
                </button>
              </td>
              <td className="px-4 py-3 text-slate-700">{formatCurrency(tx.amount)}</td>
              <td className="px-4 py-3 text-slate-700">{formatCurrency(calcTransactionFee(tx.amount))}</td>
              <td className="px-4 py-3 text-slate-700">{formatCurrency(calcNetSale(tx.amount))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
