import { ProductVariations } from "@/types";
import { formatCurrency } from "@/lib/utils";

export function VariationSummaryTable({ variations }: { variations: ProductVariations }) {
  const columns = variations.attributes.map((a) => a.name);

  return (
    <div className="overflow-x-auto rounded-lg border border-[var(--color-border)]">
      <table className="w-full min-w-[30rem] text-sm">
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
          <tr>
            {columns.map((col) => (
              <th key={col} className="px-4 py-2">
                {col}
              </th>
            ))}
            <th className="px-4 py-2">Quantity</th>
            <th className="px-4 py-2">Price</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-border)]">
          {variations.combinations.map((combo) => (
            <tr key={combo.id}>
              {columns.map((col) => (
                <td key={col} className="px-4 py-2 text-slate-700">
                  {combo.values[col]}
                </td>
              ))}
              <td className="px-4 py-2 text-slate-700">{combo.quantity}</td>
              <td className="px-4 py-2 text-slate-700">{formatCurrency(combo.price)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
