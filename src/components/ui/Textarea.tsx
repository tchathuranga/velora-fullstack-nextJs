import { TextareaHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, hint, className, id, required, ...props }, ref) => {
    const areaId = id ?? props.name;
    return (
      <label className="block" htmlFor={areaId}>
        {label && (
          <span className="mb-1.5 block text-sm font-medium text-slate-700">
            {label}
            {required && <span className="text-[var(--color-danger)]"> *</span>}
          </span>
        )}
        <textarea
          ref={ref}
          id={areaId}
          required={required}
          className={clsx("input-base min-h-24 resize-y", className)}
          {...props}
        />
        {hint && <span className="mt-1 block text-xs text-[var(--color-muted)]">{hint}</span>}
      </label>
    );
  },
);

Textarea.displayName = "Textarea";
