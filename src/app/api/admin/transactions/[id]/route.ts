import { requireAdmin } from "@/server/auth";
import { audit } from "@/server/audit";
import { queryOne } from "@/server/db";
import { conflict, notFound, ok, parseBody, route } from "@/server/http";
import { transactionConfirmSchema } from "@/server/validation";

/** Marks a payment as received (or un-received). */
export const PATCH = route(async (req, ctx: RouteContext<"/api/admin/transactions/[id]">) => {
  const session = await requireAdmin(req);
  const { id } = await ctx.params;
  const { confirmed } = await parseBody(req, transactionConfirmSchema);

  const existing = await queryOne<{ payout_id: string | null }>("SELECT payout_id FROM seller_transactions WHERE id = $1", [id]);
  if (!existing) throw notFound("Transaction not found.");
  if (existing.payout_id && !confirmed) throw conflict("This payment has already been paid out to the seller, so it can't be marked as not received.");

  await queryOne(
    "UPDATE seller_transactions SET confirmed = $2, confirmed_at = CASE WHEN $2 THEN now() END WHERE id = $1 RETURNING id",
    [id, confirmed],
  );
  await audit(session, confirmed ? "payment.confirmed" : "payment.unconfirmed", "seller_transaction", id);
  return ok({ id, confirmed });
});
