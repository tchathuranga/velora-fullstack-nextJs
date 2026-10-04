"use client";

import clsx from "clsx";
import { ArrowDown, ArrowUp, ImageIcon } from "lucide-react";
import { Banner } from "@/types";

export function BannerList({
  banners,
  activeId,
  onSelect,
  onMove,
}: {
  banners: Banner[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onMove: (id: string, direction: "up" | "down") => void;
}) {
  if (banners.length === 0) {
    return <p className="px-4 py-6 text-sm text-[var(--color-muted)]">No banners yet. Add one to get started.</p>;
  }

  return (
    <div className="divide-y divide-[var(--color-border)]">
      {banners.map((banner, i) => (
        <div
          key={banner.id}
          className={clsx(
            "flex w-full items-center gap-3 px-4 py-3 text-left transition",
            activeId === banner.id ? "bg-[var(--color-primary-light)]" : "hover:bg-slate-50",
          )}
        >
          <button type="button" onClick={() => onSelect(banner.id)} className="flex flex-1 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-slate-100 text-slate-400">
              {banner.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={banner.imageUrl} alt={banner.title} className="h-full w-full object-cover" />
              ) : (
                <ImageIcon size={16} />
              )}
            </span>
            <span
              className={clsx(
                "truncate text-sm font-medium",
                activeId === banner.id ? "text-[var(--color-primary)]" : "text-slate-700",
              )}
            >
              {banner.title || "Untitled banner"}
            </span>
          </button>
          <div className="flex shrink-0 gap-1">
            <button
              type="button"
              aria-label="Move up"
              disabled={i === 0}
              onClick={() => onMove(banner.id, "up")}
              className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-30"
            >
              <ArrowUp size={14} />
            </button>
            <button
              type="button"
              aria-label="Move down"
              disabled={i === banners.length - 1}
              onClick={() => onMove(banner.id, "down")}
              className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-30"
            >
              <ArrowDown size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
