import { query } from "./db";
import { OrderItemRow, OrderRow, toOrder } from "./serializers";

const ORDER_COLUMNS = `o.id, o.buyer_id, o.buyer_name, o.subtotal, o.delivery_cost, o.total, o.payment_method,
  o.billing, o.order_note, o.save_address, o.status, o.tracking_steps, o.created_at`;
const ITEM_COLUMNS =
  "oi.order_id, oi.product_id, oi.store_id, oi.title, oi.price, oi.quantity, oi.icon, oi.variation, oi.tracking_number";

/** Loads orders matching `where` (aliased `o`) with their items, optionally keeping only one store's items. */
export async function loadOrders(where: string, params: unknown[], onlyStoreId?: string) {
  const orders = await query<OrderRow>(`SELECT ${ORDER_COLUMNS} FROM orders o WHERE ${where} ORDER BY o.created_at DESC`, params);
  if (orders.length === 0) return [];

  const items = await query<OrderItemRow>(
    `SELECT ${ITEM_COLUMNS} FROM order_items oi
      WHERE oi.order_id = ANY($1::text[]) ${onlyStoreId ? "AND oi.store_id = $2" : ""} ORDER BY oi.title`,
    onlyStoreId ? [orders.map((o) => o.id), onlyStoreId] : [orders.map((o) => o.id)],
  );
  return orders.map((o) =>
    toOrder(
      o,
      items.filter((i) => i.order_id === o.id),
    ),
  );
}
