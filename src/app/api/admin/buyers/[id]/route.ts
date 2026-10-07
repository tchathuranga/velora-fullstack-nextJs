import { requireAdmin } from "@/server/auth";
import { queryOne } from "@/server/db";
import { isUuid, notFound, ok, parseBody, route } from "@/server/http";
import { buyerStatusSchema } from "@/server/validation";

/** Limit or reactivate a buyer. A limited account can no longer sign in. */
export const PATCH = route(async (req, ctx: RouteContext<"/api/admin/buyers/[id]">) => {
  await requireAdmin(req);
  const { id } = await ctx.params;
  const { status } = await parseBody(req, buyerStatusSchema);
  if (!isUuid(id)) throw notFound("Buyer not found.");

  const row = await queryOne("UPDATE users SET status = $2 WHERE id = $1 AND role = 'buyer' RETURNING id", [id, status]);
  if (!row) throw notFound("Buyer not found.");
  return ok({ id, status });
});
