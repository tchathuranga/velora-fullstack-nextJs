import type { PaymentMethod, Product } from "@/types";
import type { CartItem } from "@/Redux/slices/cartSlice";
import { shippingCost } from "@/lib/shipping";

/** Charged per unit when an old saved cart has no shipping rates of its own. */
export const FALLBACK_DELIVERY_FEE = 350;

/** One line of a cart or "Buy it now" checkout, merged with the live listing so price, stock and shipping are current. */
export interface CheckoutLine {
  key: string;
  productId: string;
  variationId?: string;
  variation?: Record<string, string>;
  slug?: string;
  title: string;
  icon: string;
  image?: string;
  price: number;
  quantity: number;
  /** Units available right now (of this variation, if it has one). */
  stock: number;
  freeDelivery: boolean;
  deliveryFee: number;
  extraDeliveryFee: number;
  paymentMethods: PaymentMethod[];
  handlingTime: string;
  deliveryTime: string;
  /** The listing was ended, removed, or this variation no longer exists. */
  unavailable: boolean;
}

export const cartKey = (productId: string, variationId?: string | null) => `${productId}|${variationId ?? ""}`;

export function buildLine(item: CartItem, product: Product | undefined): CheckoutLine {
  const combo = item.variationId ? product?.variations?.combinations.find((c) => c.id === item.variationId) : undefined;
  const variationGone = Boolean(item.variationId && product && !combo);
  return {
    key: cartKey(item.productId, item.variationId),
    productId: item.productId,
    variationId: item.variationId,
    variation: combo?.values ?? item.variation,
    slug: product?.slug ?? item.slug,
    title: item.title,
    icon: item.icon,
    image: product?.images?.[0],
    price: combo?.price ?? product?.price ?? item.price,
    quantity: item.quantity,
    stock: combo?.quantity ?? product?.quantity ?? 0,
    freeDelivery: product ? Boolean(product.freeDelivery) : item.deliveryFee === 0,
    deliveryFee: product?.deliveryFee ?? item.deliveryFee ?? FALLBACK_DELIVERY_FEE,
    extraDeliveryFee: product?.extraDeliveryFee ?? item.extraDeliveryFee ?? 0,
    paymentMethods: product?.paymentMethods ?? item.paymentMethods,
    handlingTime: product?.handlingTime ?? "",
    deliveryTime: product?.deliveryTime ?? "",
    unavailable: !product || variationGone,
  };
}

/** Shipping for a set of lines: per listing, first unit + extra for each further unit across all of its variations. */
export function linesShipping(lines: CheckoutLine[]): number {
  const perProduct = new Map<string, { line: CheckoutLine; quantity: number }>();
  for (const line of lines) {
    const entry = perProduct.get(line.productId);
    if (entry) entry.quantity += line.quantity;
    else perProduct.set(line.productId, { line, quantity: line.quantity });
  }
  let total = 0;
  for (const { line, quantity } of perProduct.values()) total += shippingCost(line, quantity);
  return total;
}

export const linesSubtotal = (lines: CheckoutLine[]) => lines.reduce((sum, l) => sum + l.price * l.quantity, 0);

/** Shipping attributed to one listing within `lines` (used to show a per-line figure). */
export function productShipping(lines: CheckoutLine[], productId: string): number {
  return linesShipping(lines.filter((l) => l.productId === productId));
}
