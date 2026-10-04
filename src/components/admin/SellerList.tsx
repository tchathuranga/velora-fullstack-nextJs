"use client";

import { useState } from "react";
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
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const filtered = q ? stores.filter((s) => s.storeName.toLowerCase().includes(q)) : stores;

  return (
    <div className="flex max-h-[28rem] flex-col">
      <div className="border-b border-[var(--color-border)] p-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search stores..."
          aria-label="Search stores"
          className="w-full rounded-md border border-[var(--color-border)] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]"
        />
      </div>
      <div className="min-h-0 flex-1 divide-y divide-[var(--color-border)] overflow-y-auto">
      {filtered.length === 0 && (
        <p className="px-4 py-6 text-center text-sm text-[var(--color-muted)]">No stores found.</p>
      )}
      {filtered.map((store) => {
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
    </div>
  );
}
