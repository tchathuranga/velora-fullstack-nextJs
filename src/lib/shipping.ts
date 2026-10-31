/** Shared by the browser (cart, checkout, product page) and the server (order pricing), so both always agree. */

export interface ShippingRates {
  freeDelivery?: boolean;
  /** Fee for the first unit of a listing in an order. */
  deliveryFee?: number;
  /** Fee for each further unit of the same listing in the same order. */
  extraDeliveryFee?: number;
}

/** Rs. first + (Rs. extra × (quantity − 1)); zero for free shipping. */
export function shippingCost(rates: ShippingRates, quantity: number): number {
  if (rates.freeDelivery || quantity < 1) return 0;
  return (rates.deliveryFee ?? 0) + (rates.extraDeliveryFee ?? 0) * (quantity - 1);
}

export interface DayRange {
  min: number;
  max: number;
}

/** "2–3 days" → {2,3}; "3 business days" → {3,3}; text with no number → null. */
export function parseDayRange(text: string | undefined | null): DayRange | null {
  const numbers = (text ?? "").match(/\d+/g)?.map(Number);
  if (!numbers?.length) return null;
  const a = numbers[0];
  const b = numbers.length > 1 ? numbers[1] : a;
  return { min: Math.min(a, b), max: Math.max(a, b) };
}

const TIME_ZONE = "Asia/Colombo";

/** Today's calendar date (YYYY-MM-DD) in Sri Lanka, regardless of the viewer's own time zone. */
export function todayInColombo(now: Date = new Date()): string {
  return now.toLocaleDateString("en-CA", { timeZone: TIME_ZONE });
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export interface DeliveryEstimate {
  minDays: number;
  maxDays: number;
  /** Latest expected delivery date (YYYY-MM-DD) if the buyer pays on `from`. */
  latestDate: string;
}

/** Handling + delivery time → "within 5–8 days" / "by 2026-10-29", counted from the purchase date. */
export function estimateDelivery(handlingTime: string, deliveryTime: string, from: string = todayInColombo()): DeliveryEstimate | null {
  const handling = parseDayRange(handlingTime);
  const delivery = parseDayRange(deliveryTime);
  if (!handling || !delivery) return null;
  const minDays = handling.min + delivery.min;
  const maxDays = handling.max + delivery.max;
  return { minDays, maxDays, latestDate: addDays(from, maxDays) };
}

export function formatEstimate(estimate: DeliveryEstimate): { within: string; by: string } {
  const by = new Date(`${estimate.latestDate}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
  const days = estimate.minDays === estimate.maxDays ? `${estimate.maxDays}` : `${estimate.minDays}–${estimate.maxDays}`;
  return { within: `Delivery within ${days} days`, by: `Estimated delivery by ${by}` };
}

export const WEBSITE_FEE_RATE = 0.03;

/** The marketplace commission on (item price + shipping), and what the seller keeps. */
export function sellerEarnings(itemPrice: number, shipping: number) {
  const fee = Math.round((itemPrice + shipping) * WEBSITE_FEE_RATE * 100) / 100;
  return { fee, earnings: Math.round((itemPrice + shipping - fee) * 100) / 100 };
}
