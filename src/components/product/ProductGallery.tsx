"use client";

import { useState } from "react";
import clsx from "clsx";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";

export function ProductGallery({
  productId,
  icon,
  count,
  title,
  images,
  overrideImage,
}: {
  productId: string;
  icon: string;
  count: number;
  title: string;
  images?: string[];
  /** The selected variation's photo; shown as the large image until a thumbnail is clicked. */
  overrideImage?: string;
}) {
  const [picked, setPicked] = useState<{ index: number; override?: string } | null>(null);
  // A thumbnail the shopper picked wins, unless they have since chosen a different variation.
  const active = picked && picked.override === overrideImage ? picked.index : -1;
  const setActive = (index: number) => setPicked({ index, override: overrideImage });
  const thumbs = Array.from({ length: Math.max(count, 1) });

  return (
    <div>
      <div className="card aspect-square w-full overflow-hidden">
        <PlaceholderImage
          seed={`${productId}-${active}`}
          icon={icon}
          image={active === -1 ? (overrideImage ?? images?.[0]) : images?.[active]}
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
              (active === -1 ? (!overrideImage && i === 0) : active === i) ? "border-[var(--color-primary)]" : "border-transparent",
            )}
          >
            <PlaceholderImage seed={`${productId}-${i}`} icon={icon} image={images?.[i]} className="h-full w-full" />
          </button>
        ))}
      </div>
    </div>
  );
}
