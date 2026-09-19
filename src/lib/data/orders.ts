import { Order } from "@/types";

export function getOrderById(orders: Order[], id: string): Order | undefined {
  return orders.find((o) => o.id === id);
}
