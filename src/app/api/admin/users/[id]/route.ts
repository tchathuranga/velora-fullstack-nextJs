import { audit } from "@/server/audit";
import { requireAdmin } from "@/server/auth";
import { queryOne } from "@/server/db";
import { badRequest, conflict, isForeignKeyViolation, isUuid, notFound, ok, route } from "@/server/http";

/**
 * Permanently delete an account. Cascades to the user's address, wishlist, store and its products; a buyer's past orders
 * are kept (their buyer link is cleared). A seller whose store has order history cannot be deleted - that record is
 * financial history - so limit the account instead. Admins can't delete themselves.
 */
export const DELETE = route(async (req, ctx: RouteContext<"/api/admin/users/[id]">) => {
  const session = await requireAdmin(req);
  const { id } = await ctx.params;
  if (!isUuid(id)) throw notFound("User not found.");
  if (id === session.userId) throw badRequest("You can't delete your own account.");

  try {
    const row = await queryOne<{ username: string; email: string }>("DELETE FROM users WHERE id = $1 RETURNING username, email", [id]);
    if (!row) throw notFound("User not found.");
    await audit(session, "user.deleted", "user", id, { username: row.username, email: row.email });
    return ok({ id });
  } catch (err) {
    if (isForeignKeyViolation(err)) {
      throw conflict("This seller's store has orders, payments or payouts on record, so the account can't be deleted. Limit it instead.");
    }
    throw err;
  }
});
