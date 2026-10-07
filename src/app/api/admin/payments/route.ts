import { requireAdmin } from "@/server/auth";
import { query } from "@/server/db";
import { ok, route } from "@/server/http";
import { TransactionRow, toTransaction } from "@/server/serializers";

/** Every seller transaction plus what each store has already been paid out. */
export const GET = route(async (req) => {
  await requireAdmin(req);
  const [transactions, payouts] = await Promise.all([
    query<TransactionRow>(
      `SELECT id, store_id, product_title, payment_method, amount, confirmed, created_at
         FROM seller_transactions ORDER BY created_at DESC`,
    ),
    query<{ store_id: string; paid_out: number }>(
      "SELECT store_id, sum(amount) AS paid_out FROM seller_payouts GROUP BY store_id",
    ),
  ]);

  return ok({
    transactions: transactions.map(toTransaction),
    paidOut: Object.fromEntries(payouts.map((p) => [p.store_id, p.paid_out])) as Record<string, number>,
  });
});
