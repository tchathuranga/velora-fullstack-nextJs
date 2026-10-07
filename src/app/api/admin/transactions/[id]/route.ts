import { requireAdmin } from "@/server/auth";
import { queryOne } from "@/server/db";
import { notFound, ok, parseBody, route } from "@/server/http";
import { transactionConfirmSchema } from "@/server/validation";

/** Marks a payment as received (or un-received). */
export const PATCH = route(async (req, ctx: RouteContext<"/api/admin/transactions/[id]">) => {
  await requireAdmin(req);
  const { id } = await ctx.params;
  const { confirmed } = await parseBody(req, transactionConfirmSchema);

  const row = await queryOne(
    "UPDATE seller_transactions SET confirmed = $2, confirmed_at = CASE WHEN $2 THEN now() END WHERE id = $1 RETURNING id",
    [id, confirmed],
  );
  if (!row) throw notFound("Transaction not found.");
  return ok({ id, confirmed });
});
