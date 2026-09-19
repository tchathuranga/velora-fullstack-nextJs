"use client";

import clsx from "clsx";
import { Buyer, BuyerStatus } from "@/types";
import { Badge } from "@/components/ui/Badge";

export function BuyerList({
  buyers,
  activeId,
  statuses,
  onSelect,
}: {
  buyers: Buyer[];
  activeId: string | null;
  statuses: Record<string, BuyerStatus>;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="divide-y divide-[var(--color-border)]">
      {buyers.map((buyer) => {
        const status = statuses[buyer.id] ?? buyer.status;
        return (
          <button
            key={buyer.id}
            type="button"
            onClick={() => onSelect(buyer.id)}
            className={clsx(
              "flex w-full items-center justify-between px-4 py-3 text-left transition",
              activeId === buyer.id ? "bg-[var(--color-primary-light)]" : "hover:bg-slate-50",
            )}
          >
            <span className={clsx("text-sm font-medium", activeId === buyer.id ? "text-[var(--color-primary)]" : "text-slate-700")}>
              {buyer.name}
            </span>
            <Badge tone={status === "active" ? "success" : "danger"}>{status === "active" ? "Active" : "Limited"}</Badge>
          </button>
        );
      })}
    </div>
  );
}
