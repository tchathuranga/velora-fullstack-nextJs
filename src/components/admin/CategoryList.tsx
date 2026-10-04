"use client";

import clsx from "clsx";
import { Category } from "@/types";
import { Badge } from "@/components/ui/Badge";

export function CategoryList({
  categories,
  activeId,
  onSelect,
}: {
  categories: Category[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  if (categories.length === 0) {
    return <p className="px-4 py-6 text-sm text-[var(--color-muted)]">No categories yet. Add one to get started.</p>;
  }

  return (
    <div className="divide-y divide-[var(--color-border)]">
      {categories.map((category) => (
        <button
          key={category.id}
          type="button"
          onClick={() => onSelect(category.id)}
          className={clsx(
            "flex w-full items-center justify-between px-4 py-3 text-left transition",
            activeId === category.id ? "bg-[var(--color-primary-light)]" : "hover:bg-slate-50",
          )}
        >
          <span
            className={clsx("text-sm font-medium", activeId === category.id ? "text-[var(--color-primary)]" : "text-slate-700")}
          >
            {category.name}
          </span>
          <Badge tone={activeId === category.id ? "primary" : "neutral"}>{category.subcategories.length}</Badge>
        </button>
      ))}
    </div>
  );
}
