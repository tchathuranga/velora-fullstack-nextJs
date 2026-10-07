import { query } from "@/server/db";
import { ok, route } from "@/server/http";
import { CATEGORY_SELECT, CategoryRow, toCategory } from "@/server/serializers";

export const GET = route(async () => {
  const rows = await query<CategoryRow>(`SELECT ${CATEGORY_SELECT} FROM categories c ORDER BY c.position, c.name`);
  return ok(rows.map(toCategory));
});
