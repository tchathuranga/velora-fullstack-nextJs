"use client";

import { Banknote, Truck } from "lucide-react";
import clsx from "clsx";
import { PaymentMethod } from "@/types";

const options: { value: PaymentMethod; title: string; description: string; icon: typeof Banknote }[] = [
  {
    value: "bank_transfer",
    title: "Bank transfer",
    description:
      "After placing your order, you will be able to see our bank details. You can transfer the payment to our bank account and send the payment receipt to the WhatsApp number provided on the order confirmation page.",
    icon: Banknote,
  },
  {
    value: "cod",
    title: "Cash on delivery",
    description: "Pay the full order amount directly to the delivery person when your package is delivered to you.",
    icon: Truck,
  },
];

export function PaymentMethodSelector({
  value,
  onChange,
}: {
  value: PaymentMethod;
  onChange: (value: PaymentMethod) => void;
}) {
  return (
    <div className="space-y-3">
      {options.map((option) => {
        const Icon = option.icon;
        const active = value === option.value;
        return (
          <label
            key={option.value}
            className={clsx(
              "flex cursor-pointer gap-3 rounded-xl border p-4 transition",
              active ? "border-[var(--color-primary)] bg-[var(--color-primary-light)]" : "border-[var(--color-border)] hover:border-slate-300",
            )}
          >
            <input
              type="radio"
              name="paymentMethod"
              className="mt-1"
              checked={active}
              onChange={() => onChange(option.value)}
            />
            <Icon size={20} className={clsx("mt-0.5 shrink-0", active ? "text-[var(--color-primary)]" : "text-slate-400")} />
            <div>
              <p className="text-sm font-semibold text-slate-900">{option.title}</p>
              <p className="mt-1 text-xs text-[var(--color-muted)]">{option.description}</p>
            </div>
          </label>
        );
      })}
    </div>
  );
}
