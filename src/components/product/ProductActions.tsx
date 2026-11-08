"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Minus, Plus, Check, Truck, RotateCcw, CalendarDays } from "lucide-react";
import clsx from "clsx";
import { Product, VariationCombination } from "@/types";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { formatCurrency } from "@/lib/utils";
import { estimateDelivery, formatEstimate, shippingCost } from "@/lib/shipping";

/** "Blue / Large" — the combination's option values in attribute order. */
export const combinationLabel = (c: VariationCombination) => Object.values(c.values).join(" / ");

export function ProductActions({
  product,
  combination,
  onSelectCombination,
}: {
  product: Product;
  /** The variation currently selected on the page (null for listings without variations). */
  combination: VariationCombination | null;
  onSelectCombination: (id: string) => void;
}) {
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const router = useRouter();
  const [wantedQuantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const combinations = product.variations?.combinations ?? [];
  const attributes = (product.variations?.attributes ?? []).filter((a) => a.options.length > 0);
  const price = combination?.price ?? product.price;
  const availableQty = combination?.quantity ?? product.quantity;
  const outOfStock = availableQty === 0;
  const wishlisted = isWishlisted(product.id);

  // The quantity always stays within what the chosen variation has in stock.
  const quantity = Math.min(Math.max(1, wantedQuantity), Math.max(1, availableQty));

  const shipping = shippingCost(product, quantity);
  const estimate = estimateDelivery(product.handlingTime, product.deliveryTime);
  const estimateText = estimate ? formatEstimate(estimate) : null;

  const handleAddToCart = () => {
    addToCart(product, quantity, combination ?? undefined);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  // "Buy it now" goes straight to checkout for this product only — nothing is added to the cart.
  const handleBuyNow = () => {
    const params = new URLSearchParams({ buy: product.slug, qty: String(quantity) });
    if (combination) params.set("variation", combination.id);
    router.push(`/checkout?${params.toString()}`);
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="flex flex-wrap items-baseline gap-x-3 text-2xl font-bold text-slate-900">
          {formatCurrency(price)}
          {!combination && product.compareAtPrice && (
            <>
              <span className="text-base font-normal text-[var(--color-muted)] line-through">{formatCurrency(product.compareAtPrice)}</span>
              <span className="rounded bg-[var(--color-danger-light)] px-2 py-0.5 text-xs font-semibold text-[var(--color-danger)]">
                {Math.round((1 - product.price / product.compareAtPrice) * 100)}% off
              </span>
            </>
          )}
        </p>
        {!combination && product.saleEndsAt && (
          <p className="text-xs text-[var(--color-muted)]">Sale ends {new Date(product.saleEndsAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
        )}
        <p className="mt-1 flex flex-wrap items-center gap-x-3 text-sm">
          {outOfStock ? (
            <span className="rounded-full bg-[var(--color-danger-light)] px-2.5 py-0.5 text-xs font-semibold text-[var(--color-danger)]">
              Out of Stock
            </span>
          ) : (
            <span className="text-[var(--color-muted)]">{availableQty} available</span>
          )}
          <span className="text-[var(--color-muted)]">{product.soldCount} sold</span>
        </p>
      </div>

      {/* One dropdown per attribute (e.g. Color, Model); together they pick a single combination. */}
      {combinations.length > 0 && combination && (
        <div className="space-y-3">
          {attributes.map((attr) => {
            // Combinations that match the other dropdowns' current choices.
            const others = combinations.filter((c) =>
              attributes.every((a) => a.name === attr.name || c.values[a.name] === combination.values[a.name]),
            );
            return (
              <Select
                key={attr.name}
                label={attr.name}
                value={combination.values[attr.name] ?? ""}
                onChange={(e) => {
                  const target = { ...combination.values, [attr.name]: e.target.value };
                  const exact = combinations.find((c) => attributes.every((a) => c.values[a.name] === target[a.name]));
                  const fallback = combinations.find((c) => c.values[attr.name] === e.target.value && c.quantity > 0);
                  const next = exact ?? fallback;
                  if (next) onSelectCombination(next.id);
                }}
              >
                {attr.options.map((option) => {
                  const inStock = others.some((c) => c.values[attr.name] === option && c.quantity > 0);
                  return (
                    <option key={option} value={option} disabled={!inStock && option !== combination.values[attr.name]}>
                      {option}
                      {inStock ? "" : " (Out of stock)"}
                    </option>
                  );
                })}
              </Select>
            );
          })}
          <p className="text-xs text-[var(--color-muted)]">
            Selected: {combinationLabel(combination)}
            {combination.quantity === 0 ? " — out of stock" : ` — ${combination.quantity} available`}
          </p>
        </div>
      )}

      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-slate-700">Quantity</span>
        <div className="flex items-center rounded-lg border border-[var(--color-border)]">
          <button
            type="button"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            disabled={outOfStock}
            className="flex h-9 w-9 items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            aria-label="Decrease quantity"
          >
            <Minus size={14} />
          </button>
          <span className="w-10 text-center text-sm font-medium">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity(Math.min(availableQty || 1, quantity + 1))}
            disabled={outOfStock || quantity >= availableQty}
            className="flex h-9 w-9 items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            aria-label="Increase quantity"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      <ul className="space-y-3 rounded-lg bg-slate-50 p-4 text-sm">
        <li className="flex gap-2">
          <Truck size={16} className="mt-0.5 shrink-0 text-[var(--color-muted)]" />
          <div>
            {product.freeDelivery ? (
              <p className="font-semibold text-[var(--color-success)]">Free Shipping</p>
            ) : (
              <>
                <p className="font-medium text-slate-800">
                  Shipping: {formatCurrency(product.deliveryFee ?? 0)} for the first item
                  {!!product.extraDeliveryFee && <> + {formatCurrency(product.extraDeliveryFee)} for each additional item</>}
                </p>
                {quantity > 1 && (
                  <p className="text-[var(--color-muted)]">
                    Shipping for {quantity} items: <span className="font-medium text-slate-800">{formatCurrency(shipping)}</span>
                  </p>
                )}
              </>
            )}
          </div>
        </li>
        <li className="flex gap-2">
          <CalendarDays size={16} className="mt-0.5 shrink-0 text-[var(--color-muted)]" />
          <div>
            {estimateText ? (
              <>
                <p className="font-medium text-slate-800">{estimateText.by}</p>
                <p className="text-[var(--color-muted)]">{estimateText.within} if you order today</p>
              </>
            ) : (
              <>
                <p className="text-[var(--color-muted)]">Handling time: {product.handlingTime}</p>
                <p className="text-[var(--color-muted)]">Delivery time: {product.deliveryTime}</p>
              </>
            )}
          </div>
        </li>
        {product.returnsAccepted && (
          <li className="flex gap-2">
            <RotateCcw size={16} className="mt-0.5 shrink-0 text-[var(--color-muted)]" />
            <div>
              <p className="font-medium text-slate-800">Return policy</p>
              <p className="text-[var(--color-muted)]">Seller accepts returns within 30 days.</p>
            </div>
          </li>
        )}
      </ul>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button variant="accent" size="lg" className="flex-1" onClick={handleBuyNow} disabled={outOfStock}>
          Buy It Now
        </Button>
        <Button variant="outline" size="lg" className="flex-1" onClick={handleAddToCart} disabled={outOfStock}>
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
