"use client";

import clsx from "clsx";
import { Store, SellerStatus } from "@/types";
import { StatusBadge } from "@/components/admin/StatusBadge";

export function SellerList({
  stores,
  activeId,
  statuses,
  onSelect,
}: {
  stores: Store[];
  activeId: string | null;
  statuses: Record<string, SellerStatus>;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="divide-y divide-[var(--color-border)]">
      {stores.map((store) => {
        const status = statuses[store.id] ?? store.status;
        return (
          <button
            key={store.id}
            type="button"
            onClick={() => onSelect(store.id)}
            className={clsx(
              "flex w-full items-center justify-between px-4 py-3 text-left transition",
              activeId === store.id ? "bg-[var(--color-primary-light)]" : "hover:bg-slate-50",
            )}
          >
            <span className={clsx("text-sm font-medium", activeId === store.id ? "text-[var(--color-primary)]" : "text-slate-700")}>
              {store.storeName}
            </span>
            <StatusBadge status={status} />
          </button>
        );
      })}
    </div>
  );
}
