import { Order } from "@/types";

const STORAGE_KEY = "velora_orders";

function readAll(): Record<string, Order> {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveOrder(order: Order) {
  if (typeof window === "undefined") return;
  try {
    const all = readAll();
    all[order.id] = order;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // ignore
  }
}

export function getStoredOrder(id: string, fallbackOrders: Order[] = []): Order | undefined {
  const all = readAll();
  return all[id] ?? fallbackOrders.find((o) => o.id === id);
}

export function generateOrderId(): string {
  return `ORD-${Math.floor(10000 + Math.random() * 89999)}`;
}
