"use client";

import { useState } from "react";
import clsx from "clsx";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";

export function ProductGallery({
  productId,
  icon,
  count,
  title,
}: {
  productId: string;
  icon: string;
  count: number;
  title: string;
}) {
  const [active, setActive] = useState(0);
  const thumbs = Array.from({ length: Math.max(count, 1) });

  return (
    <div>
      <div className="card aspect-square w-full overflow-hidden">
        <PlaceholderImage
          seed={`${productId}-${active}`}
          icon={icon}
          label={title}
          className="h-full w-full"
        />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {thumbs.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActive(i)}
            aria-label={`View image ${i + 1}`}
            className={clsx(
              "h-14 w-14 overflow-hidden rounded-lg border-2 transition",
              active === i ? "border-[var(--color-primary)]" : "border-transparent",
            )}
          >
            <PlaceholderImage seed={`${productId}-${i}`} icon={icon} className="h-full w-full" />
          </button>
        ))}
      </div>
    </div>
  );
}
