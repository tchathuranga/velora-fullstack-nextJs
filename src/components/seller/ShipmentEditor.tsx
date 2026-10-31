"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { getErrorMessage, useSetShipmentMutation } from "@/Redux/api";

/** Lets the seller mark an order line as shipped by entering the courier company and the tracking number. */
export function ShipmentEditor({
  orderId,
  itemId,
  trackingNumber,
  courierName,
}: {
  orderId: string;
  itemId: string;
  trackingNumber?: string;
  courierName?: string;
}) {
  const [saveShipment, { isLoading: saving }] = useSetShipmentMutation();
  const [tracking, setTracking] = useState("");
  const [courier, setCourier] = useState("");
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const shipped = Boolean(trackingNumber && courierName);

  const startEditing = () => {
    setTracking(trackingNumber ?? "");
    setCourier(courierName ?? "");
    setError("");
    setEditing(true);
  };

  const save = async () => {
    if (!tracking.trim() || !courier.trim()) return;
    try {
      await saveShipment({ orderId, itemId, trackingNumber: tracking.trim(), courierName: courier.trim() }).unwrap();
      setEditing(false);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (editing) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-end gap-2">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-700">Courier company name</span>
            <input
              autoFocus
              value={courier}
              onChange={(e) => setCourier(e.target.value)}
              placeholder="e.g. Farder"
              className="input-base w-48"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-700">Tracking number</span>
            <input
              value={tracking}
              onChange={(e) => setTracking(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), save())}
              placeholder="e.g. IND123456"
              className="input-base w-48"
            />
          </label>
          <Button size="sm" onClick={save} disabled={!tracking.trim() || !courier.trim() || saving}>
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
    <div className="flex flex-col items-start gap-1">
      {shipped && (
        <div className="text-xs text-[var(--color-muted)]">
          <p>
            Courier: <span className="font-medium text-slate-800">{courierName}</span>
          </p>
          <p>
            Tracking: <span className="font-mono text-slate-800">{trackingNumber}</span>
          </p>
        </div>
      )}
      <button type="button" onClick={startEditing} className="text-sm font-medium text-[var(--color-primary)] hover:underline">
        {shipped ? "Edit shipping details" : "Mark as shipped"}
      </button>
    </div>
  );
}
