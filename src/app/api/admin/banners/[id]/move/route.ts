import { requireAdmin } from "@/server/auth";
import { withTransaction } from "@/server/db";
import { isUuid, notFound, ok, parseBody, route } from "@/server/http";
import { bannerMoveSchema } from "@/server/validation";

/** Swaps a banner with its neighbour in the slider order. */
export const POST = route(async (req, ctx: RouteContext<"/api/admin/banners/[id]/move">) => {
  await requireAdmin(req);
  const { id } = await ctx.params;
  const { direction } = await parseBody(req, bannerMoveSchema);
  if (!isUuid(id)) throw notFound("Banner not found.");

  await withTransaction(async (client) => {
    // Re-number first so positions are always a clean 0..n-1 sequence before swapping.
    const { rows } = await client.query<{ id: string }>("SELECT id FROM banners ORDER BY position, id FOR UPDATE");
    const index = rows.findIndex((r) => r.id === id);
    if (index === -1) throw notFound("Banner not found.");

    const swapWith = direction === "up" ? index - 1 : index + 1;
    if (swapWith >= 0 && swapWith < rows.length) [rows[index], rows[swapWith]] = [rows[swapWith], rows[index]];

    for (const [position, row] of rows.entries()) {
      await client.query("UPDATE banners SET position = $2 WHERE id = $1", [row.id, position]);
    }
  });
  return ok({ ok: true });
});
