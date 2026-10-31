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
    const { rowCount } = await client.query(
      "UPDATE order_items SET tracking_number = $4, courier_name = $5 WHERE order_id = $1 AND id = $2 AND store_id = $3",
      [id, itemId, session.storeId, trackingNumber, courierName],
    );
    if (!rowCount) throw notFound("Order item not found.");

    const { rows } = await client.query<{
      status: string;
      buyer_id: string | null;
      tracking_steps: { label: string; done: boolean; date?: string }[];
    }>("SELECT status, buyer_id, tracking_steps FROM orders WHERE id = $1 FOR UPDATE", [id]);
    const order = rows[0];
    if (order?.status === "processing") {
      const steps = order.tracking_steps.map((s) =>
        s.label === "Handed to courier" ? { ...s, done: true, date: todayInColombo() } : s,
      );
      await client.query("UPDATE orders SET status = 'shipped', tracking_steps = $2 WHERE id = $1", [id, JSON.stringify(steps)]);
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
