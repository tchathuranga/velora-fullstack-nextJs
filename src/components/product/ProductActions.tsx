"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Heart, Minus, Plus, Check } from "lucide-react";
import clsx from "clsx";
import { Product } from "@/types";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { formatCurrency } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setJustAdded, setNote, setQuantity, updateSelected } from "@/store/uiSlice";

export function ProductActions({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const router = useRouter();

  const dispatch = useAppDispatch();
  const attributes = product.variations?.attributes ?? [];
  const selected = useAppSelector((state) => state.ui.selected);
  const quantity = useAppSelector((state) => state.ui.quantity);
  const note = useAppSelector((state) => state.ui.note);
  const justAdded = useAppSelector((state) => state.ui.justAdded);

  const activeCombination = useMemo(() => {
    if (!product.variations) return null;
    return (
      product.variations.combinations.find((c) =>
        Object.entries(selected).every(([key, value]) => c.values[key] === value),
      ) ?? product.variations.combinations[0]
    );
  }, [product.variations, selected]);

  const price = activeCombination?.price ?? product.price;
  const availableQty = activeCombination?.quantity ?? product.quantity;
  const wishlisted = isWishlisted(product.id);

  const handleAddToCart = () => {
    addToCart(product, quantity);
    dispatch(setJustAdded(true));
    setTimeout(() => dispatch(setJustAdded(false)), 1500);
  };

  const handleBuyNow = () => {
    addToCart(product, quantity);
    router.push("/checkout");
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-2xl font-bold text-slate-900">{formatCurrency(price)}</p>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          {availableQty > 0 ? `${availableQty} in stock` : "Out of stock"}
        </p>
      </div>

      {attributes.map((attr) => (
        <div key={attr.name}>
          <p className="mb-2 text-sm font-medium text-slate-700">{attr.name}</p>
          <div className="flex flex-wrap gap-2">
            {attr.options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => dispatch(updateSelected({ key: attr.name, value: option }))}
                className={clsx(
                  "rounded-lg border px-3 py-1.5 text-sm transition",
                  selected[attr.name] === option
                    ? "border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)]"
                    : "border-[var(--color-border)] text-slate-700 hover:border-slate-400",
                )}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      ))}

      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-slate-700">Quantity</span>
        <div className="flex items-center rounded-lg border border-[var(--color-border)]">
          <button
            type="button"
            onClick={() => dispatch(setQuantity(Math.max(1, quantity - 1)))}
            className="flex h-9 w-9 items-center justify-center text-slate-600 hover:bg-slate-50"
            aria-label="Decrease quantity"
          >
            <Minus size={14} />
          </button>
          <span className="w-10 text-center text-sm font-medium">{quantity}</span>
          <button
            type="button"
            onClick={() => dispatch(setQuantity(Math.min(availableQty || 1, quantity + 1)))}
            className="flex h-9 w-9 items-center justify-center text-slate-600 hover:bg-slate-50"
            aria-label="Increase quantity"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      <Textarea
        label="Buyer Note"
        placeholder="Add a note for the seller (optional)"
        value={note}
        onChange={(e) => dispatch(setNote(e.target.value))}
        className="min-h-16"
      />

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button variant="accent" size="lg" className="flex-1" onClick={handleBuyNow} disabled={availableQty === 0}>
          Buy It Now
        </Button>
        <Button variant="outline" size="lg" className="flex-1" onClick={handleAddToCart} disabled={availableQty === 0}>
          {justAdded ? (
            <>
              <Check size={16} /> Added
            </>
          ) : (
            "Add to Cart"
          )}
        </Button>
      </div>
      <Button variant="ghost" fullWidth onClick={() => toggleWishlist(product.id)}>
        <Heart size={16} className={clsx(wishlisted && "fill-[var(--color-danger)] text-[var(--color-danger)]")} />
        {wishlisted ? "Added to Wishlist" : "Add to Wishlist"}
      </Button>
    </div>
  );
}
