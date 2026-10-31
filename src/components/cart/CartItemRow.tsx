"use client";

import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { CheckoutLine } from "@/lib/checkout";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { formatCurrency } from "@/lib/utils";
import { useCart, MAX_CART_ITEMS } from "@/context/CartContext";

export function CartItemRow({ line }: { line: CheckoutLine }) {
  const { updateQuantity, removeFromCart } = useCart();
  const href = line.slug ? `/product/${line.slug}` : "#";
  const maxQuantity = Math.min(MAX_CART_ITEMS, Math.max(line.stock, 1));

  return (
    <div className="flex items-center gap-4 py-4">
      <Link href={href} className="h-20 w-20 shrink-0 overflow-hidden rounded-lg">
        <PlaceholderImage seed={line.productId} icon={line.icon} image={line.image} className="h-full w-full" />
      </Link>
      <div className="min-w-0 flex-1">
        <Link href={href} className="line-clamp-2 text-sm font-medium text-slate-800 hover:text-[var(--color-primary)]">
          {line.title}
        </Link>
        {line.variation && (
          <p className="text-xs text-[var(--color-muted)]">{Object.values(line.variation).join(" / ")}</p>
        )}
        <p className="mt-1 text-sm font-semibold text-slate-900">{formatCurrency(line.price)}</p>
        {line.unavailable ? (
          <p className="mt-1 text-xs font-medium text-[var(--color-danger)]">No longer available — remove it to continue.</p>
        ) : line.stock === 0 ? (
          <p className="mt-1 text-xs font-medium text-[var(--color-danger)]">Out of stock</p>
        ) : line.quantity > line.stock ? (
          <p className="mt-1 text-xs font-medium text-[var(--color-danger)]">Only {line.stock} left in stock.</p>
        ) : null}
      </div>
      <div className="flex items-center rounded-lg border border-[var(--color-border)]">
        <button
          type="button"
          onClick={() => updateQuantity(line.productId, line.variationId, line.quantity - 1)}
          className="flex h-8 w-8 items-center justify-center text-slate-600 hover:bg-slate-50"
          aria-label="Decrease quantity"
        >
          <Minus size={14} />
        </button>
        <span className="w-8 text-center text-sm font-medium">{line.quantity}</span>
        <button
          type="button"
          disabled={line.quantity >= maxQuantity}
          onClick={() => updateQuantity(line.productId, line.variationId, Math.min(maxQuantity, line.quantity + 1))}
          className="flex h-8 w-8 items-center justify-center text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Increase quantity"
        >
          <Plus size={14} />
        </button>
      </div>
      <button
        type="button"
        onClick={() => removeFromCart(line.productId, line.variationId)}
        aria-label="Remove item"
        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-[var(--color-danger-light)] hover:text-[var(--color-danger)]"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}
