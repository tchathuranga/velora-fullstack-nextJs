"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { getErrorMessage, useSetTrackingNumberMutation } from "@/Redux/api";

export function TrackingNumberEditor({
  orderId,
  productId,
  trackingNumber,
}: {
  orderId: string;
  productId: string;
  trackingNumber?: string;
}) {
  const [saveTracking, { isLoading: saving }] = useSetTrackingNumberMutation();
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const saved = trackingNumber ?? "";

  const startEditing = () => {
    setDraft(saved);
    setError("");
    setEditing(true);
  };

  const save = async () => {
    const value = draft.trim();
    if (!value) return;
    try {
      await saveTracking({ orderId, productId, trackingNumber: value }).unwrap();
      setEditing(false);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (editing) {
    return (
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && save()}
            placeholder="Tracking number"
            className="input-base w-48"
          />
          <Button size="sm" onClick={save} disabled={!draft.trim() || saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </div>
        {error && <p className="text-xs text-[var(--color-danger)]">{error}</p>}
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
