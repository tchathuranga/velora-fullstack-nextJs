import { HTMLAttributes } from "react";
import clsx from "clsx";

type Tone = "neutral" | "success" | "danger" | "warning" | "primary";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

const toneClasses: Record<Tone, string> = {
  neutral: "bg-slate-100 text-slate-600",
  success: "bg-[var(--color-success-light)] text-[var(--color-success)]",
  danger: "bg-[var(--color-danger-light)] text-[var(--color-danger)]",
  warning: "bg-[var(--color-warning-light)] text-[var(--color-warning)]",
  primary: "bg-[var(--color-primary-light)] text-[var(--color-primary)]",
};

export function Badge({ tone = "neutral", className, ...props }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}
