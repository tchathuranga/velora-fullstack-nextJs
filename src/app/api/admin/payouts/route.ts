import { NextResponse } from "next/server";
import { audit } from "@/server/audit";
import { requireAdmin } from "@/server/auth";
import { withTransaction } from "@/server/db";
import { badRequest, notFound, parseBody, route } from "@/server/http";
import { payoutSchema } from "@/server/validation";

/** Pays out a store's available funds: net confirmed sales minus everything already paid out. */
export const POST = route(async (req) => {
  const session = await requireAdmin(req);
  const { storeId } = await parseBody(req, payoutSchema);

  const amount = await withTransaction(async (client) => {
    // Lock the store row so two admins can't pay out the same funds twice.
    const store = await client.query("SELECT 1 FROM stores WHERE id = $1 FOR UPDATE", [storeId]);
    if (store.rowCount === 0) throw notFound("Store not found.");

    const { rows: confirmed } = await client.query<{ net: number }>(
      "SELECT amount - fee_amount AS net FROM seller_transactions WHERE store_id = $1 AND confirmed",
      [storeId],
    );
    const { rows: paid } = await client.query<{ total: number }>(
      "SELECT COALESCE(sum(amount), 0) AS total FROM seller_payouts WHERE store_id = $1",
      [storeId],
    );

    const netSale = confirmed.reduce((sum, tx) => sum + Number(tx.net), 0);
    const available = Math.round((netSale - Number(paid[0].total)) * 100) / 100;
    if (available <= 0) throw badRequest("There are no available funds to pay out.");

    const { rows: payout } = await client.query<{ id: string }>("INSERT INTO seller_payouts (store_id, amount) VALUES ($1, $2) RETURNING id", [storeId, available]);
    // Record which payments this payout settled, so it can be reconciled later.
    await client.query("UPDATE seller_transactions SET payout_id = $2 WHERE store_id = $1 AND confirmed AND payout_id IS NULL", [storeId, payout[0].id]);
    await audit(session, "payout.created", "store", storeId, { amount: available, payoutId: payout[0].id }, client);
    return available;
  });

  return NextResponse.json({ storeId, amount }, { status: 201 });
});
