import { requireSeller } from "@/server/auth";
import { withTransaction } from "@/server/db";
import { isUuid, notFound, ok, parseBody, route } from "@/server/http";
import { trackingSchema } from "@/server/validation";

/** A seller adds / edits the courier tracking number for their item. The first number moves the order to "shipped". */
export const PATCH = route(async (req, ctx: RouteContext<"/api/orders/[id]/items/[productId]">) => {
  const session = await requireSeller(req);
  const { id, productId } = await ctx.params;
  const { trackingNumber } = await parseBody(req, trackingSchema);
  if (!isUuid(productId)) throw notFound("Order item not found.");

  await withTransaction(async (client) => {
    const { rowCount } = await client.query(
      "UPDATE order_items SET tracking_number = $4 WHERE order_id = $1 AND product_id = $2 AND store_id = $3",
      [id.toUpperCase(), productId, session.storeId, trackingNumber],
    );
    if (!rowCount) throw notFound("Order item not found.");

    const { rows } = await client.query<{ status: string; tracking_steps: { label: string; done: boolean; date?: string }[] }>(
      "SELECT status, tracking_steps FROM orders WHERE id = $1 FOR UPDATE",
      [id.toUpperCase()],
    );
    const order = rows[0];
    if (order?.status === "processing") {
      const steps = order.tracking_steps.map((s) =>
        s.label === "Handed to courier" ? { ...s, done: true, date: new Date().toISOString().slice(0, 10) } : s,
      );
      await client.query("UPDATE orders SET status = 'shipped', tracking_steps = $2 WHERE id = $1", [
        id.toUpperCase(),
        JSON.stringify(steps),
      ]);
    }
  });
  return ok({ trackingNumber });
});
