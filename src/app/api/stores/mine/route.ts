import { requireSession } from "@/server/auth";
import { queryOne } from "@/server/db";
import { ok, route } from "@/server/http";
import { STORE_SELECT, StoreRow, toStore } from "@/server/serializers";

/** The signed-in account's own store in any status, including private details. `store` is null when they have none. */
export const GET = route(async (req) => {
  const session = await requireSession(req);
  const row = await queryOne<StoreRow>(`SELECT ${STORE_SELECT} FROM stores s WHERE s.owner_id = $1`, [session.userId]);
  return ok({ store: row ? toStore(row, true) : null });
});
