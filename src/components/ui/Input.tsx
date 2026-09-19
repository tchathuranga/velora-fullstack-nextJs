import { InputHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, className, id, required, ...props }, ref) => {
    const inputId = id ?? props.name;
    return (
      <label className="block" htmlFor={inputId}>
        {label && (
          <span className="mb-1.5 block text-sm font-medium text-slate-700">
            {label}
            {required && <span className="text-[var(--color-danger)]"> *</span>}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          required={required}
          className={clsx(
            "input-base",
            error && "border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:ring-red-100",
            className,
          )}
          {...props}
        />
        {error ? (
          <span className="mt-1 block text-xs text-[var(--color-danger)]">{error}</span>
        ) : hint ? (
          <span className="mt-1 block text-xs text-[var(--color-muted)]">{hint}</span>
        ) : null}
      </label>
    );
  },
);

Input.displayName = "Input";
