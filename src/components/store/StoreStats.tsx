import { StoreStats as StoreStatsType } from "@/types";
import { formatCurrency } from "@/lib/utils";

export function StoreStats({ stats }: { stats: StoreStatsType }) {
  const items = [
    { label: "Active Listings", value: stats.activeListings },
    { label: "Orders", value: stats.orders },
    { label: "Unsold", value: stats.unsoldListings },
    { label: "Order amount", value: formatCurrency(stats.orderAmount) },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="card p-4 text-center">
          <p className="text-lg font-bold text-slate-900">{item.value}</p>
          <p className="text-xs text-[var(--color-muted)]">{item.label}</p>
        </div>
      ))}
    </div>
  );
}
