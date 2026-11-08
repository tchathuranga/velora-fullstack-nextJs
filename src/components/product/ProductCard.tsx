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
          image={product.images?.[0]}
          label={product.title}
          className="h-full w-full transition-transform duration-300 group-hover:scale-105"
        />
        {product.status === "ended" ? (
          <span className="absolute left-2 top-2 rounded-full bg-slate-800/85 px-2 py-0.5 text-[10px] font-semibold text-white">Ended</span>
        ) : product.quantity === 0 ? (
          <span className="absolute left-2 top-2 rounded-full bg-[var(--color-danger)] px-2 py-0.5 text-[10px] font-semibold text-white">
            Out of Stock
          </span>
        ) : null}
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
        <p className="mt-auto flex flex-wrap items-baseline gap-x-2 text-base font-semibold text-slate-900">
          {formatCurrency(product.price)}
          {product.compareAtPrice && (
            <>
              <span className="text-xs font-normal text-[var(--color-muted)] line-through">{formatCurrency(product.compareAtPrice)}</span>
              <span className="rounded bg-[var(--color-danger-light)] px-1.5 py-0.5 text-[11px] font-semibold text-[var(--color-danger)]">
                -{Math.round((1 - product.price / product.compareAtPrice) * 100)}%
              </span>
            </>
          )}
        </p>
      </div>
    </Link>
  );
}
