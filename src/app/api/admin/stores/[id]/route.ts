import { requireAdmin } from "@/server/auth";
import { queryOne } from "@/server/db";
import { isUuid, notFound, ok, parseBody, route } from "@/server/http";
import { STORE_SELECT, StoreRow, toStore } from "@/server/serializers";
import { storeStatusSchema } from "@/server/validation";

/** Approve / decline / limit a seller's store. */
export const PATCH = route(async (req, ctx: RouteContext<"/api/admin/stores/[id]">) => {
  await requireAdmin(req);
  const { id } = await ctx.params;
  const { status } = await parseBody(req, storeStatusSchema);
  if (!isUuid(id)) throw notFound("Store not found.");

  const updated = await queryOne<{ id: string }>("UPDATE stores SET status = $2 WHERE id = $1 RETURNING id", [id, status]);
  if (!updated) throw notFound("Store not found.");

  const row = await queryOne<StoreRow>(`SELECT ${STORE_SELECT} FROM stores s WHERE s.id = $1`, [id]);
  return ok(toStore(row!, true));
});
