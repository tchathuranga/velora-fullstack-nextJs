import { requireAdmin } from "@/server/auth";
import { query } from "@/server/db";
import { ok, route } from "@/server/http";
import { STORE_SELECT, StoreRow, toStore } from "@/server/serializers";

export const GET = route(async (req) => {
  await requireAdmin(req);
  const rows = await query<StoreRow>(`SELECT ${STORE_SELECT} FROM stores s ORDER BY s.created_at DESC`);
  return ok(rows.map((r) => toStore(r, true)));
});
