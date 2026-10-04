const STORAGE_KEY = "velora_tracking_numbers";

function readAll(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function trackingKey(orderId: string, productId: string): string {
  return `${orderId}:${productId}`;
}

export function getTrackingNumber(key: string): string {
  return readAll()[key] ?? "";
}

export function saveTrackingNumber(key: string, value: string) {
  if (typeof window === "undefined") return;
  try {
    const all = readAll();
    all[key] = value;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // ignore
  }
}
