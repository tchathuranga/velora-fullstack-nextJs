import { getSession } from "@/server/auth";
import { queryOne } from "@/server/db";
import { forbidden, notFound, ok, route } from "@/server/http";
import { loadOrders } from "@/server/orders";

/**
 * Order details.
 *  - `?as=seller`: a seller's view of an order — only their own store's items.
 *  - Otherwise: the buyer who placed it, or an admin, sees everything. Guest orders (no buyer account) are
 *    readable by anyone holding the order id, a random unguessable reference shown on the confirmation page.
 */
export const GET = route(async (req, ctx: RouteContext<"/api/orders/[id]">) => {
  const { id: rawId } = await ctx.params;
  const id = rawId.toUpperCase();

  if (req.nextUrl.searchParams.get("as") === "seller") {
    const session = await getSession(req);
    if (session?.role !== "seller" || !session.storeId) throw forbidden("Only approved sellers can view store orders.");
    const [order] = await loadOrders("o.id = $1", [id], session.storeId);
    if (!order || order.items.length === 0) throw notFound("Order not found for your store.");
    return ok(order);
  }

  const [order] = await loadOrders("o.id = $1", [id]);
  if (!order) throw notFound("Order not found.");

  const owner = await queryOne<{ buyer_id: string | null }>("SELECT buyer_id FROM orders WHERE id = $1", [id]);
  const buyerId = owner?.buyer_id ?? null;
  if (buyerId === null) return ok(order);

  const session = await getSession(req);
  if (session && (session.role === "admin" || session.userId === buyerId)) return ok(order);
  throw notFound("Order not found.");
});
