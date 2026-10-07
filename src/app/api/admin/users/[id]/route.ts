import { requireAdmin } from "@/server/auth";
import { queryOne } from "@/server/db";
import { badRequest, isUuid, notFound, ok, route } from "@/server/http";

/**
 * Permanently delete an account. Cascades to the user's address, wishlist, store and its products;
 * past orders are kept (their buyer link is cleared). Admins can't delete themselves.
 */
export const DELETE = route(async (req, ctx: RouteContext<"/api/admin/users/[id]">) => {
  const session = await requireAdmin(req);
  const { id } = await ctx.params;
  if (!isUuid(id)) throw notFound("User not found.");
  if (id === session.userId) throw badRequest("You can't delete your own account.");

  const row = await queryOne("DELETE FROM users WHERE id = $1 RETURNING id", [id]);
  if (!row) throw notFound("User not found.");
  return ok({ id });
});
