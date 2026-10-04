"use client";

import { useState } from "react";
import clsx from "clsx";
import { Check, Pencil, Trash2, X as XIcon } from "lucide-react";

export function EditableName({
  value,
  onSave,
  onDelete,
  deleteLabel = "Delete",
  size = "md",
  allowEmpty = false,
  placeholder = "None",
}: {
  value: string;
  onSave: (name: string) => void;
  onDelete?: () => void;
  deleteLabel?: string;
  size?: "md" | "sm";
  allowEmpty?: boolean;
  placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  if (editing) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const trimmed = draft.trim();
          if (trimmed || allowEmpty) onSave(trimmed);
          setEditing(false);
        }}
        className="flex items-center gap-2"
      >
        <input
          autoFocus
          value={draft}
          placeholder={allowEmpty ? placeholder : undefined}
          onChange={(e) => setDraft(e.target.value)}
          className={clsx("input-base flex-1", size === "sm" && "py-1.5 text-sm")}
        />
        <button
          type="submit"
          aria-label="Save"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[var(--color-success)] hover:bg-[var(--color-success-light)]"
        >
          <Check size={16} />
        </button>
        <button
          type="button"
          aria-label="Cancel"
          onClick={() => {
            setDraft(value);
            setEditing(false);
          }}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100"
        >
          <XIcon size={16} />
        </button>
      </form>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className={clsx("flex-1", size === "md" ? "text-base font-semibold text-slate-900" : "text-sm text-slate-700")}>
        {value || <span className="font-normal italic text-slate-400">{placeholder}</span>}
      </span>
      <button
        type="button"
        aria-label="Rename"
        onClick={() => {
          setDraft(value);
          setEditing(true);
        }}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600"
      >
        <Pencil size={14} />
      </button>
      {onDelete && (
        <button
          type="button"
          aria-label={deleteLabel}
          onClick={onDelete}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-[var(--color-danger-light)] hover:text-[var(--color-danger)]"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
}
