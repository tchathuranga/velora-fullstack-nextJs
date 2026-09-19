import { SelectHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, className, id, required, children, ...props }, ref) => {
    const selectId = id ?? props.name;
    return (
      <label className="block" htmlFor={selectId}>
        {label && (
          <span className="mb-1.5 block text-sm font-medium text-slate-700">
            {label}
            {required && <span className="text-[var(--color-danger)]"> *</span>}
          </span>
        )}
        <select
          ref={ref}
          id={selectId}
          required={required}
          className={clsx("input-base", className)}
          {...props}
        >
          {children}
        </select>
      </label>
    );
  },
);

Select.displayName = "Select";
