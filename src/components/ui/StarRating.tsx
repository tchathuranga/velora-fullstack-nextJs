"use client";

import { Star } from "lucide-react";
import clsx from "clsx";

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
  readOnly?: boolean;
  className?: string;
}

export function StarRating({
  value,
  onChange,
  size = 18,
  readOnly = false,
  className,
}: StarRatingProps) {
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className={clsx("inline-flex items-center gap-0.5", className)}>
      {stars.map((star) => {
        const filled = star <= Math.round(value);
        if (readOnly) {
          return (
            <Star
              key={star}
              size={size}
              className={filled ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"}
            />
          );
        }
        return (
          <button
            key={star}
            type="button"
            aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
            onClick={() => onChange?.(star)}
            className="p-0.5"
          >
            <Star
              size={size}
              className={clsx(
                "transition-colors",
                filled ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200 hover:fill-amber-200 hover:text-amber-300",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
