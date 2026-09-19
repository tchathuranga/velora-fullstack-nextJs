export function formatCurrency(amount: number): string {
  return `Rs. ${amount.toLocaleString("en-LK", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function calcTransactionFee(amount: number): number {
  return Math.round(amount * 0.03 * 100) / 100;
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
