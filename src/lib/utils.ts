export function formatCurrency(amount: number): string {
  return `Rs. ${amount.toLocaleString("en-LK", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

/** The marketplace commission on each sale. Every transaction records the rate it was actually charged (see seller_transactions.fee_rate). */
export const TRANSACTION_FEE_RATE = 0.03;

export function calcTransactionFee(amount: number): number {
  return Math.round(amount * TRANSACTION_FEE_RATE * 100) / 100;
}

export function calcNetSale(amount: number): number {
  return Math.round((amount - calcTransactionFee(amount)) * 100) / 100;
}

export function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

let idCounter = 0;
export function generateId(prefix = "id"): string {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${idCounter}`;
}

export function nextBiweeklyMonday(from: Date = new Date()): Date {
  const date = new Date(from);
  const day = date.getDay();
  const daysUntilMonday = (8 - day) % 7 || 7;
  date.setDate(date.getDate() + daysUntilMonday);
  // Push out one more week so payouts land on alternating Mondays.
  const weekNumber = Math.floor(date.getTime() / (7 * 24 * 60 * 60 * 1000));
  if (weekNumber % 2 !== 0) date.setDate(date.getDate() + 7);
  return date;
}

export function statusLabel(status: string): string {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Variation values as a readable label for order lines ("Color: Red, Size: M"). Postgres jsonb does not keep key order,
 * so values read back from the database are sorted by name and labelled, which reads the same every time.
 */
export function variationLabel(values: Record<string, string>): string {
  return Object.entries(values)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, value]) => `${name}: ${value}`)
    .join(", ");
}
