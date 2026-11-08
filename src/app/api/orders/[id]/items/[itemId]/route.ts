import { requireSeller } from "@/server/auth";
import { withTransaction } from "@/server/db";
import { isUuid, notFound, ok, parseBody, route } from "@/server/http";
import { notify } from "@/server/notifications";
import { trackingSchema } from "@/server/validation";
import { todayInColombo } from "@/lib/shipping";

/**
 * A seller marks their order line as shipped by entering the courier company and tracking number (both required).
 * The first shipment moves the order to "shipped" and tells the buyer.
 */
export const PATCH = route(async (req, ctx: RouteContext<"/api/orders/[id]/items/[itemId]">) => {
  const session = await requireSeller(req);
  const { id: rawId, itemId } = await ctx.params;
  const { trackingNumber, courierName } = await parseBody(req, trackingSchema);
  if (!isUuid(itemId)) throw notFound("Order item not found.");
  const id = rawId.toUpperCase();

  await withTransaction(async (client) => {
    const line = await client.query("SELECT id FROM order_items WHERE order_id = $1 AND id = $2 AND store_id = $3", [id, itemId, session.storeId]);
    if (!line.rowCount) throw notFound("Order item not found.");
    // One shipment per order line; saving again edits the courier / tracking number.
    await client.query(
      `INSERT INTO shipments (order_item_id, tracking_number, courier_name) VALUES ($1, $2, $3)
       ON CONFLICT (order_item_id) DO UPDATE SET tracking_number = EXCLUDED.tracking_number, courier_name = EXCLUDED.courier_name`,
      [itemId, trackingNumber, courierName],
    );

    const { rows } = await client.query<{ status: string; buyer_id: string | null }>(
      "SELECT status, buyer_id FROM orders WHERE id = $1 FOR UPDATE",
      [id],
    );
    const order = rows[0];
    if (order?.status === "processing") {
      await client.query(
        "INSERT INTO order_events (order_id, type, occurred_on) VALUES ($1, 'handed_to_courier', $2) ON CONFLICT (order_id, type) DO NOTHING",
        [id, todayInColombo()],
      );
      await client.query("UPDATE orders SET status = 'shipped' WHERE id = $1", [id]);
      if (order.buyer_id) {
        await notify(
          {
            userId: order.buyer_id,
            type: "order",
            title: `Order ${id} has shipped`,
            body: `${courierName} · tracking number ${trackingNumber}`,
            link: "/account",
          },
          client,
        );
      }
    }
  });
  return ok({ trackingNumber, courierName });
});
