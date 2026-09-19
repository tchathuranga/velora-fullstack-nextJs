"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import clsx from "clsx";
import { Product } from "@/types";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { StarRating } from "@/components/ui/StarRating";
import { useWishlist } from "@/context/WishlistContext";
import { formatCurrency, truncate } from "@/lib/utils";

export function ProductCard({ product }: { product: Product }) {
  const { isWishlisted, toggleWishlist } = useWishlist();
  const wishlisted = isWishlisted(product.id);

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group card flex flex-col overflow-hidden transition hover:shadow-md"
    >
      <div className="relative aspect-square w-full overflow-hidden">
        <PlaceholderImage
          seed={product.id}
          icon={product.icon}
          label={product.title}
          className="h-full w-full transition-transform duration-300 group-hover:scale-105"
        />
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            toggleWishlist(product.id);
          }}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-500 shadow-sm transition hover:text-[var(--color-danger)]"
        >
          <Heart size={16} className={clsx(wishlisted && "fill-[var(--color-danger)] text-[var(--color-danger)]")} />
        </button>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="text-sm font-medium text-slate-800">{truncate(product.title, 60)}</p>
        <div className="flex items-center gap-1.5">
          <StarRating value={product.rating} readOnly size={13} />
          <span className="text-xs text-[var(--color-muted)]">({product.reviewCount})</span>
        </div>
        <p className="mt-auto text-base font-semibold text-slate-900">{formatCurrency(product.price)}</p>
      </div>
    </Link>
  );
}
