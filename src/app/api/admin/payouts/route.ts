import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth";
import { withTransaction } from "@/server/db";
import { badRequest, notFound, parseBody, route } from "@/server/http";
import { payoutSchema } from "@/server/validation";
import { calcNetSale } from "@/lib/utils";

/** Pays out a store's available funds: net confirmed sales minus everything already paid out. */
export const POST = route(async (req) => {
  await requireAdmin(req);
  const { storeId } = await parseBody(req, payoutSchema);

  const amount = await withTransaction(async (client) => {
    // Lock the store row so two admins can't pay out the same funds twice.
    const store = await client.query("SELECT 1 FROM stores WHERE id = $1 FOR UPDATE", [storeId]);
    if (store.rowCount === 0) throw notFound("Store not found.");

    const { rows: confirmed } = await client.query<{ amount: number }>(
      "SELECT amount FROM seller_transactions WHERE store_id = $1 AND confirmed",
      [storeId],
    );
    const { rows: paid } = await client.query<{ total: number }>(
      "SELECT COALESCE(sum(amount), 0) AS total FROM seller_payouts WHERE store_id = $1",
      [storeId],
    );

    const netSale = confirmed.reduce((sum, tx) => sum + calcNetSale(Number(tx.amount)), 0);
    const available = Math.round((netSale - Number(paid[0].total)) * 100) / 100;
    if (available <= 0) throw badRequest("There are no available funds to pay out.");

    await client.query("INSERT INTO seller_payouts (store_id, amount) VALUES ($1, $2)", [storeId, available]);
    return available;
  });

  return NextResponse.json({ storeId, amount }, { status: 201 });
});
