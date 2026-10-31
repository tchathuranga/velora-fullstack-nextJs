import { requireSeller } from "@/server/auth";
import { query } from "@/server/db";
import { ok, route } from "@/server/http";
import { ProductRow, productSelect, toProduct } from "@/server/serializers";

/** The seller's own listings in every state; the dashboard splits them into Active and Unsold by `status`. */
export const GET = route(async (req) => {
  const session = await requireSeller(req);
  const rows = await query<ProductRow>(
    `SELECT ${productSelect(false)} FROM products p WHERE p.store_id = $1 ORDER BY p.created_at DESC`,
    [session.storeId],
  );
  return ok(rows.map(toProduct));
});
