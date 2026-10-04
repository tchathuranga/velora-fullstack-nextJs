import { InputHTMLAttributes, forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import clsx from "clsx";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, className, id, required, type, ...props }, ref) => {
    const inputId = id ?? props.name;
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";

    return (
      <label className="block" htmlFor={inputId}>
        {label && (
          <span className="mb-1.5 block text-sm font-medium text-slate-700">
            {label}
            {required && <span className="text-[var(--color-danger)]"> *</span>}
          </span>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            required={required}
            type={isPassword && showPassword ? "text" : type}
            className={clsx(
              "input-base",
              isPassword && "pr-10",
              error && "border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:ring-red-100",
              className,
            )}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-[var(--color-muted)] hover:text-slate-700"
              aria-label={showPassword ? "Hide password" : "Show password"}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}
        </div>
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
