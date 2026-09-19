import { CheckCircle2, Circle } from "lucide-react";
import clsx from "clsx";
import { Order } from "@/types";

export function TrackingSteps({ order }: { order: Order }) {
  return (
    <div className="space-y-1">
      <p className="mb-3 text-sm text-[var(--color-muted)]">Order {order.id}</p>
      <ol>
        {order.trackingSteps.map((step, i) => (
          <li key={step.label} className="flex gap-3">
            <div className="flex flex-col items-center">
              {step.done ? (
                <CheckCircle2 size={20} className="text-[var(--color-success)]" />
              ) : (
                <Circle size={20} className="text-slate-300" />
              )}
              {i < order.trackingSteps.length - 1 && (
                <span className={clsx("mt-0.5 h-8 w-px", step.done ? "bg-[var(--color-success)]" : "bg-slate-200")} />
              )}
            </div>
            <div className="pb-6">
              <p className={clsx("text-sm font-medium", step.done ? "text-slate-800" : "text-slate-400")}>
                {step.label}
              </p>
              {step.date && <p className="text-xs text-[var(--color-muted)]">{step.date}</p>}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
