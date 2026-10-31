import clsx from "clsx";
import Link from "next/link";
import { StoreStats as StoreStatsType } from "@/types";
import { formatCurrency } from "@/lib/utils";

export type ListingTab = "active" | "unsold";

/**
 * The owner can switch listing tabs and open their orders from the corresponding stats.
 */
export function StoreStats({
  stats,
  selected,
  onSelect,
  ordersHref,
}: {
  stats: StoreStatsType;
  selected?: ListingTab;
  onSelect?: (tab: ListingTab) => void;
  ordersHref?: string;
}) {
  const items: { label: string; value: string | number; tab?: ListingTab; href?: string }[] = [
    { label: "Active Listings", value: stats.activeListings, tab: "active" },
    { label: "Orders", value: stats.orders, href: ordersHref },
    { label: "Unsold", value: stats.unsoldListings, tab: "unsold" },
    { label: "Order amount", value: formatCurrency(stats.orderAmount), href: ordersHref },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {items.map((item) => {
        const content = (
          <>
            <p className="text-lg font-bold text-slate-900">{item.value}</p>
            <p className="text-xs text-[var(--color-muted)]">{item.label}</p>
          </>
        );
        if (item.href) {
          return (
            <Link
              key={item.label}
              href={item.href}
              className="card p-4 text-center transition hover:border-[var(--color-primary)] hover:shadow-md"
            >
              {content}
            </Link>
          );
        }
        if (onSelect && item.tab) {
          const tab = item.tab;
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => onSelect(tab)}
              aria-pressed={selected === tab}
              className={clsx(
                "card p-4 text-center transition hover:border-[var(--color-primary)] hover:shadow-md",
                selected === tab && "border-[var(--color-primary)] ring-2 ring-[var(--color-primary-light)]",
              )}
            >
              {content}
            </button>
          );
        }
        return (
          <div key={item.label} className="card p-4 text-center">
            {content}
          </div>
        );
      })}
    </div>
  );
}
