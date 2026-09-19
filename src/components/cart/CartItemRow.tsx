"use client";

import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { CartItem } from "@/context/CartContext";
import { Product } from "@/types";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { formatCurrency } from "@/lib/utils";
import { useCart, MAX_CART_ITEMS } from "@/context/CartContext";

export function CartItemRow({ item, product }: { item: CartItem; product?: Product }) {
  const { updateQuantity, removeFromCart } = useCart();

  return (
    <div className="flex items-center gap-4 py-4">
      <Link href={product ? `/product/${product.slug}` : "#"} className="h-20 w-20 shrink-0 overflow-hidden rounded-lg">
        <PlaceholderImage seed={item.productId} icon={item.icon} className="h-full w-full" />
      </Link>
      <div className="min-w-0 flex-1">
        <Link
          href={product ? `/product/${product.slug}` : "#"}
          className="line-clamp-2 text-sm font-medium text-slate-800 hover:text-[var(--color-primary)]"
        >
          {item.title}
        </Link>
        <p className="mt-1 text-sm font-semibold text-slate-900">{formatCurrency(item.price)}</p>
      </div>
      <div className="flex items-center rounded-lg border border-[var(--color-border)]">
        <button
          type="button"
          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
          className="flex h-8 w-8 items-center justify-center text-slate-600 hover:bg-slate-50"
          aria-label="Decrease quantity"
        >
          <Minus size={14} />
        </button>
        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
        <button
          type="button"
          onClick={() => updateQuantity(item.productId, Math.min(MAX_CART_ITEMS, item.quantity + 1))}
          className="flex h-8 w-8 items-center justify-center text-slate-600 hover:bg-slate-50"
          aria-label="Increase quantity"
        >
          <Plus size={14} />
        </button>
      </div>
      <button
        type="button"
        onClick={() => removeFromCart(item.productId)}
        aria-label="Remove item"
        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-[var(--color-danger-light)] hover:text-[var(--color-danger)]"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}
