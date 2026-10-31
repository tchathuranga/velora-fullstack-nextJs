import { query } from "./db";
import { OrderItemRow, OrderRow, toOrder } from "./serializers";

const ORDER_COLUMNS = `o.id, o.buyer_id, u.username AS buyer_username, o.buyer_name, o.subtotal, o.delivery_cost, o.total,
  o.payment_method, o.billing, o.order_note, o.save_address, o.status, o.tracking_steps, o.created_at`;
const ITEM_COLUMNS = `oi.id, oi.order_id, oi.product_id, oi.store_id, oi.title, oi.price, oi.quantity, oi.icon, oi.variation,
  oi.variation_id, oi.shipping_cost, oi.tracking_number, oi.courier_name, to_char(oi.ship_by, 'YYYY-MM-DD') AS ship_by`;

/** Loads orders matching `where` (aliased `o`) with their items, optionally keeping only one store's items. */
export async function loadOrders(where: string, params: unknown[], onlyStoreId?: string) {
  const orders = await query<OrderRow>(
    `SELECT ${ORDER_COLUMNS} FROM orders o LEFT JOIN users u ON u.id = o.buyer_id WHERE ${where} ORDER BY o.created_at DESC`,
    params,
  );
  if (orders.length === 0) return [];

  const items = await query<OrderItemRow>(
    `SELECT ${ITEM_COLUMNS} FROM order_items oi
      WHERE oi.order_id = ANY($1::text[]) ${onlyStoreId ? "AND oi.store_id = $2" : ""} ORDER BY oi.title, oi.variation_id`,
    onlyStoreId ? [orders.map((o) => o.id), onlyStoreId] : [orders.map((o) => o.id)],
  );
  return orders.map((o) => {
    const own = items.filter((i) => i.order_id === o.id);
    const order = toOrder(o, own);
    // A seller only sees their own lines, so the totals they see are for those lines alone.
    if (onlyStoreId) {
      order.subtotal = own.reduce((sum, i) => sum + i.price * i.quantity, 0);
      order.deliveryCost = own.reduce((sum, i) => sum + i.shipping_cost, 0);
      order.total = order.subtotal + order.deliveryCost;
    }
    return order;
  });
}
