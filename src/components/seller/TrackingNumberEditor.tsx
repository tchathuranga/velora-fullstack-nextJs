"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { getTrackingNumber, saveTrackingNumber } from "@/lib/trackingStorage";

export function TrackingNumberEditor({ trackingKey }: { trackingKey: string }) {
  const [saved, setSaved] = useState("");
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setSaved(getTrackingNumber(trackingKey));
  }, [trackingKey]);

  const startEditing = () => {
    setDraft(saved);
    setEditing(true);
  };

  const save = () => {
    const value = draft.trim();
    if (!value) return;
    saveTrackingNumber(trackingKey, value);
    setSaved(value);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && save()}
          placeholder="Tracking number"
          className="input-base w-48"
        />
        <Button size="sm" onClick={save} disabled={!draft.trim()}>
          Save
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-1 sm:items-end">
      {saved && (
        <p className="text-xs text-[var(--color-muted)]">
          Tracking: <span className="font-mono text-slate-800">{saved}</span>
        </p>
      )}
      <button
        type="button"
        onClick={startEditing}
        className="text-sm font-medium text-[var(--color-primary)] hover:underline"
      >
        {saved ? "Edit tracking number" : "Add tracking number"}
      </button>
    </div>
  );
}
