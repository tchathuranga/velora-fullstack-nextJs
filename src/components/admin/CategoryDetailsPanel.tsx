"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Category } from "@/types";
import { Button } from "@/components/ui/Button";
import { ImageUploadButton } from "@/components/ui/ImageUploadButton";
import { EditableName } from "@/components/admin/EditableName";

export function CategoryDetailsPanel({
  category,
  onRename,
  onImageChange,
  onImageError,
  onDelete,
  onAddSubcategory,
  onRenameSubcategory,
  onDeleteSubcategory,
}: {
  category: Category;
  onRename: (name: string) => void;
  onImageChange: (url: string | null) => Promise<unknown> | void;
  onImageError: (message: string) => void;
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
        <h3 className="text-sm font-semibold text-slate-900">Card photo</h3>
        <p className="mt-1 text-xs text-[var(--color-muted)]">Shown on this category's card on the home page.</p>
        <div className="mt-2 flex items-center gap-3">
          <div
            className="relative h-24 w-40 overflow-hidden rounded-xl bg-slate-200 bg-cover bg-center"
            style={category.imageUrl ? { backgroundImage: `url(${category.imageUrl})` } : undefined}
          >
            {!category.imageUrl && (
              <span className="absolute inset-0 flex items-center justify-center px-2 text-center text-xs text-slate-500">
                Default photo
              </span>
            )}
            <ImageUploadButton
              kind="category"
              label="Upload category photo"
              onUploaded={async (url) => onImageChange(url)}
              onError={onImageError}
              className="absolute bottom-1.5 right-1.5"
            />
          </div>
          {category.imageUrl && (
            <Button type="button" variant="outline" size="sm" onClick={() => onImageChange(null)}>
              <Trash2 size={14} />
              Remove
            </Button>
          )}
        </div>
      </div>

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
