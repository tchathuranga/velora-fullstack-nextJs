"use client";

import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";

export interface BillingFormValues {
  fullName: string;
  street: string;
  city: string;
  province: string;
  phone1: string;
  phone2: string;
  zipCode: string;
  email: string;
  orderNote: string;
}

interface BillingFormProps {
  values: BillingFormValues;
  onChange: <K extends keyof BillingFormValues>(field: K, value: BillingFormValues[K]) => void;
  saveAddress: boolean;
  onToggleSaveAddress: (value: boolean) => void;
  canSaveAddress: boolean;
}

export function BillingForm({ values, onChange, saveAddress, onToggleSaveAddress, canSaveAddress }: BillingFormProps) {
  return (
    <div className="card space-y-5 p-6">
      <h2 className="section-title">Billing details</h2>

      <Input
        label="Full name"
        required
        value={values.fullName}
        onChange={(e) => onChange("fullName", e.target.value)}
      />
      <Input
        label="Address/Street"
        required
        value={values.street}
        onChange={(e) => onChange("street", e.target.value)}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <Input label="City" required value={values.city} onChange={(e) => onChange("city", e.target.value)} />
        <Input
          label="Province"
          required
          value={values.province}
          onChange={(e) => onChange("province", e.target.value)}
        />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          label="Phone number 1"
          type="tel"
          required
          hint="We need two contact numbers"
          value={values.phone1}
          onChange={(e) => onChange("phone1", e.target.value)}
        />
        <Input
          label="Phone number 2"
          type="tel"
          required
          value={values.phone2}
          onChange={(e) => onChange("phone2", e.target.value)}
        />
      </div>
      <Input label="Zip code" required value={values.zipCode} onChange={(e) => onChange("zipCode", e.target.value)} />
      <Input
        label="Email"
        type="email"
        hint="Optional"
        value={values.email}
        onChange={(e) => onChange("email", e.target.value)}
      />
      <Textarea
        label="Order note"
        hint="Optional"
        value={values.orderNote}
        onChange={(e) => onChange("orderNote", e.target.value)}
      />

      <label className="flex items-start gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          className="mt-0.5"
          checked={saveAddress}
          disabled={!canSaveAddress}
          onChange={(e) => onToggleSaveAddress(e.target.checked)}
        />
        <span>
          Save my address
          {!canSaveAddress && (
            <span className="block text-xs text-[var(--color-muted)]">
              To save your address, you should{" "}
              <Link href="/signup" className="link-blue">
                register on our website
              </Link>{" "}
              first.
            </span>
          )}
        </span>
      </label>
    </div>
  );
}
