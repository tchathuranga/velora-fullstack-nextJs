"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight, LayoutGrid } from "lucide-react";
import { Dropdown } from "@/components/ui/Dropdown";
import { useCategories } from "@/context/CategoriesContext";

export function CategoryMenu() {
  const { categories } = useCategories();
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (categories.length === 0) return null;

  return (
    <Dropdown
      align="left"
      panelClassName="w-64 max-h-[70vh] overflow-y-auto"
      trigger={() => (
        <span className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100">
          <LayoutGrid size={18} />
          <span className="hidden sm:inline">Categories</span>
        </span>
      )}
    >
      {(close) => (
        <nav className="flex flex-col">
          {categories.map((category) => {
            const expanded = expandedId === category.id;
            return (
              <div key={category.id}>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => {
                      close();
                      router.push(`/category/${category.slug}`);
                    }}
                    className="flex-1 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 hover:text-[var(--color-primary)]"
                  >
                    {category.name}
                  </button>
                  {category.subcategories.length > 0 && (
                    <button
                      type="button"
                      aria-label={expanded ? `Collapse ${category.name}` : `Expand ${category.name}`}
                      aria-expanded={expanded}
                      onClick={() => setExpandedId(expanded ? null : category.id)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center text-slate-400 hover:text-slate-600"
                    >
                      {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                  )}
                </div>
                {expanded && (
                  <div className="bg-slate-50 pb-1">
                    {category.subcategories.map((sub) => (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => {
                          close();
                          router.push(`/category/${category.slug}?sub=${sub.slug}`);
                        }}
                        className="block w-full px-8 py-1.5 text-left text-sm text-slate-600 hover:text-[var(--color-primary)]"
                      >
                        {sub.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      )}
    </Dropdown>
  );
}
