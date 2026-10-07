import { requireBuyer } from "@/server/auth";
import { query } from "@/server/db";
import { ok, parseBody, route } from "@/server/http";
import { wishlistMergeSchema, wishlistSchema } from "@/server/validation";

async function wishlistIds(userId: string): Promise<string[]> {
  const rows = await query<{ product_id: string }>(
    "SELECT product_id FROM wishlist_items WHERE user_id = $1 ORDER BY created_at DESC",
    [userId],
  );
  return rows.map((r) => r.product_id);
}

export const GET = route(async (req) => {
  const session = await requireBuyer(req);
  return ok({ productIds: await wishlistIds(session.userId) });
});

/** Toggles one product on / off the wishlist and returns the updated list. */
export const POST = route(async (req) => {
  const session = await requireBuyer(req);
  const { productId } = await parseBody(req, wishlistSchema);

  const removed = await query("DELETE FROM wishlist_items WHERE user_id = $1 AND product_id = $2 RETURNING product_id", [
    session.userId,
    productId,
  ]);
  if (removed.length === 0) {
    await query("INSERT INTO wishlist_items (user_id, product_id) SELECT $1, id FROM products WHERE id = $2", [
      session.userId,
      productId,
    ]);
  }
  return ok({ productIds: await wishlistIds(session.userId) });
});

/** Merges a guest's locally saved wishlist into the account after login. */
export const PUT = route(async (req) => {
  const session = await requireBuyer(req);
  const { productIds } = await parseBody(req, wishlistMergeSchema);

  if (productIds.length > 0) {
    await query(
      `INSERT INTO wishlist_items (user_id, product_id)
       SELECT $1, id FROM products WHERE id = ANY($2::uuid[]) ON CONFLICT DO NOTHING`,
      [session.userId, productIds],
    );
  }
  return ok({ productIds: await wishlistIds(session.userId) });
});
