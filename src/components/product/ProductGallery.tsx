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
  variationImages = [],
}: {
  productId: string;
  icon: string;
  count: number;
  title: string;
  images?: string[];
  /** The selected variation's photos. When present they replace the listing photos in the gallery. */
  variationImages?: string[];
}) {
  const useVariation = variationImages.length > 0;
  const shown = useVariation ? variationImages : images;
  const total = useVariation ? variationImages.length : Math.max(count, 1);
  // The picked thumbnail is remembered with the photo set it belongs to, so choosing another variation resets it to the first photo.
  const setKey = useVariation ? variationImages.join("|") : "listing";
  const [picked, setPicked] = useState<{ index: number; setKey: string } | null>(null);
  const active = picked && picked.setKey === setKey && picked.index < total ? picked.index : 0;
  const seedPrefix = useVariation ? `${productId}-v` : productId;

  return (
    <div>
      <div className="card aspect-square w-full overflow-hidden">
        <PlaceholderImage seed={`${seedPrefix}-${active}`} icon={icon} image={shown?.[active]} label={title} className="h-full w-full" />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {Array.from({ length: total }).map((_, i) => (
          <button
            key={`${setKey}-${i}`}
            type="button"
            onClick={() => setPicked({ index: i, setKey })}
            aria-label={`View image ${i + 1}`}
            className={clsx(
              "h-14 w-14 overflow-hidden rounded-lg border-2 transition",
              active === i ? "border-[var(--color-primary)]" : "border-transparent",
            )}
          >
            <PlaceholderImage seed={`${seedPrefix}-${i}`} icon={icon} image={shown?.[i]} className="h-full w-full" />
          </button>
        ))}
      </div>
    </div>
  );
}
