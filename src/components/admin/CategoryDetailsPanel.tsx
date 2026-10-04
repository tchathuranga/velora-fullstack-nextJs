"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Category } from "@/types";
import { Button } from "@/components/ui/Button";
import { EditableName } from "@/components/admin/EditableName";

export function CategoryDetailsPanel({
  category,
  onRename,
  onDelete,
  onAddSubcategory,
  onRenameSubcategory,
  onDeleteSubcategory,
}: {
  category: Category;
  onRename: (name: string) => void;
  onDelete: () => void;
  onAddSubcategory: (name: string) => void;
  onRenameSubcategory: (subcategoryId: string, name: string) => void;
  onDeleteSubcategory: (subcategoryId: string) => void;
}) {
  const [newSubName, setNewSubName] = useState("");

  return (
    <div className="p-6">
      <EditableName value={category.name} onSave={onRename} onDelete={onDelete} deleteLabel="Delete category" />
      <p className="mt-1 text-xs text-[var(--color-muted)]">/{category.slug}</p>

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-slate-900">Subcategories</h3>
        {category.subcategories.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--color-muted)]">No subcategories yet.</p>
        ) : (
          <ul className="mt-2 divide-y divide-[var(--color-border)]">
            {category.subcategories.map((sub) => (
              <li key={sub.id} className="py-2">
                <EditableName
                  value={sub.name}
                  size="sm"
                  onSave={(name) => onRenameSubcategory(sub.id, name)}
                  onDelete={() => onDeleteSubcategory(sub.id)}
                  deleteLabel="Delete subcategory"
                />
              </li>
            ))}
          </ul>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const trimmed = newSubName.trim();
            if (!trimmed) return;
            onAddSubcategory(trimmed);
            setNewSubName("");
          }}
          className="mt-4 flex gap-2"
        >
          <input
            value={newSubName}
            onChange={(e) => setNewSubName(e.target.value)}
            placeholder="New subcategory name"
            className="input-base flex-1"
          />
          <Button type="submit" variant="outline" size="sm">
            <Plus size={14} />
            Add
          </Button>
        </form>
      </div>
    </div>
  );
}
