"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useCategories } from "@/context/CategoriesContext";
import { getErrorMessage } from "@/Redux/api";
import { CategoryList } from "@/components/admin/CategoryList";
import { CategoryDetailsPanel } from "@/components/admin/CategoryDetailsPanel";
import { Button } from "@/components/ui/Button";
import { PageLoader } from "@/components/ui/PageLoader";

export default function AdminCategoriesPage() {
  const {
    categories,
    loading,
    addCategory,
    updateCategory,
    deleteCategory,
    addSubcategory,
    updateSubcategory,
    deleteSubcategory,
  } = useCategories();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [error, setError] = useState("");

  // Admin mutations are async; surface a failure (e.g. a duplicate name) instead of dropping it.
  const run = (promise: Promise<unknown>) =>
    promise.then(() => setError("")).catch((err) => setError(getErrorMessage(err)));

  if (loading) return <PageLoader />;

  const activeCategory = categories.find((c) => c.id === activeId) ?? categories[0] ?? null;

  return (
    <div className="container-page py-8">
      <h1 className="text-2xl font-bold text-slate-900">Categories</h1>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        Manage the categories and subcategories sellers can assign to their products.
      </p>

      {error && (
        <p className="mt-4 rounded-lg bg-[var(--color-danger-light)] p-3 text-sm text-[var(--color-danger)]">{error}</p>
      )}

      <div className="card mt-6 grid grid-cols-1 sm:grid-cols-[18rem_1fr]">
        <div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const trimmed = newCategoryName.trim();
              if (!trimmed) return;
              run(addCategory(trimmed));
              setNewCategoryName("");
            }}
            className="flex gap-2 border-b border-[var(--color-border)] p-3"
          >
            <input
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="New category name"
              className="input-base flex-1"
            />
            <Button type="submit" size="sm">
              <Plus size={14} />
              Add
            </Button>
          </form>
          <CategoryList categories={categories} activeId={activeCategory?.id ?? null} onSelect={setActiveId} />
        </div>

        {activeCategory ? (
          <div className="border-t border-[var(--color-border)] sm:border-l sm:border-t-0">
            <CategoryDetailsPanel
              category={activeCategory}
              onRename={(name) => run(updateCategory(activeCategory.id, name))}
              onDelete={() => {
                run(deleteCategory(activeCategory.id));
                setActiveId(null);
              }}
              onAddSubcategory={(name) => run(addSubcategory(activeCategory.id, name))}
              onRenameSubcategory={(subcategoryId, name) => run(updateSubcategory(activeCategory.id, subcategoryId, name))}
              onDeleteSubcategory={(subcategoryId) => run(deleteSubcategory(activeCategory.id, subcategoryId))}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center border-t border-[var(--color-border)] p-10 text-sm text-[var(--color-muted)] sm:border-l sm:border-t-0">
            Add a category to get started.
          </div>
        )}
      </div>
    </div>
  );
}
