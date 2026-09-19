"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import { Address } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function DeliveryAddressCard({ address: initial }: { address: Address }) {
  const [address, setAddress] = useState(initial);
  const [draft, setDraft] = useState(initial);
  const [open, setOpen] = useState(false);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    setAddress(draft);
    setOpen(false);
  };

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <h2 className="section-title">Delivery address</h2>
        <button
          type="button"
          onClick={() => {
            setDraft(address);
            setOpen(true);
          }}
          className="link-blue text-sm font-medium"
        >
          Edit address
        </button>
      </div>
      <div className="mt-3 flex items-start gap-2 text-sm text-slate-700">
        <MapPin size={16} className="mt-0.5 shrink-0 text-[var(--color-muted)]" />
        {address.street || address.city ? (
          <p>
            {address.fullName} · {address.street}, {address.city}, {address.province} {address.zipCode}
            <br />
            {address.phone1} / {address.phone2}
          </p>
        ) : (
          <p className="text-[var(--color-muted)]">
            No saved address yet. Click <span className="font-medium">Edit address</span> to add one.
          </p>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Edit delivery address">
        <form onSubmit={save} className="space-y-4">
          <Input label="Full name" required value={draft.fullName} onChange={(e) => setDraft({ ...draft, fullName: e.target.value })} />
          <Input label="Address/Street" required value={draft.street} onChange={(e) => setDraft({ ...draft, street: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="City" required value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} />
            <Input label="Province" required value={draft.province} onChange={(e) => setDraft({ ...draft, province: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Phone 1" required value={draft.phone1} onChange={(e) => setDraft({ ...draft, phone1: e.target.value })} />
            <Input label="Phone 2" required value={draft.phone2} onChange={(e) => setDraft({ ...draft, phone2: e.target.value })} />
          </div>
          <Input label="Zip code" required value={draft.zipCode} onChange={(e) => setDraft({ ...draft, zipCode: e.target.value })} />
          <Button type="submit" fullWidth>
            Save address
          </Button>
        </form>
      </Modal>
    </div>
  );
}
