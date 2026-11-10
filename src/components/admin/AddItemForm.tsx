"use client";

import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { getErrorMessage } from "@/Redux/api";
import { Button } from "@/components/ui/Button";

interface AddItemFormProps {
  placeholder: string;
  /** Creates the item; reject to show an error. */
  onAdd: (value: string) => Promise<void>;
}

/** Name/title + Add button that always shows what happened: pending, success or the error message. */
export function AddItemForm({ placeholder, onAdd }: AddItemFormProps) {
  const [value, setValue] = useState("");
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const submit = async () => {
    const trimmed = value.trim();
    if (!trimmed) {
      setStatus({ kind: "error", text: "Enter a name first." });
      return;
    }
    setPending(true);
    setStatus(null);
    try {
      await onAdd(trimmed);
      setValue("");
      setStatus({ kind: "ok", text: "Added." });
    } catch (err) {
      // Error objects log as `{}`, so spell out the useful parts.
      const e = err as { status?: unknown; name?: string; message?: string; data?: unknown };
      const detail = `${e?.name ?? ""} ${e?.message ?? ""} status=${String(e?.status)} data=${JSON.stringify(e?.data)}`.trim();
      console.error(`[admin] add failed: ${detail}`);
      setStatus({ kind: "error", text: `${getErrorMessage(err)} (${detail})` });
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="border-b border-[var(--color-border)] p-3">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        className="flex gap-2"
      >
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          disabled={pending}
          className="input-base flex-1"
        />
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          {pending ? "Adding…" : "Add"}
        </Button>
      </form>
      {status && (
        <p
          role="status"
          className={`mt-2 text-xs ${status.kind === "ok" ? "text-emerald-600" : "text-[var(--color-danger)]"}`}
        >
          {status.text}
        </p>
      )}
    </div>
  );
}
