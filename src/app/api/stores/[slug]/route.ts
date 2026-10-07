import { getSession } from "@/server/auth";
import { queryOne } from "@/server/db";
import { notFound, ok, route } from "@/server/http";
import { STORE_SELECT, StoreRow, toStore } from "@/server/serializers";

export const GET = route(async (req, ctx: RouteContext<"/api/stores/[slug]">) => {
  const { slug } = await ctx.params;
  const row = await queryOne<StoreRow & { owner_id: string }>(
    `SELECT ${STORE_SELECT}, s.owner_id FROM stores s WHERE s.slug = $1`,
    [slug],
  );
  if (!row) throw notFound("Store not found.");

  const session = row.status === "active" ? null : await getSession(req);
  const canSeeUnapproved = session && (session.role === "admin" || session.userId === row.owner_id);
  if (row.status !== "active" && !canSeeUnapproved) throw notFound("Store not found.");

  return ok(toStore(row, Boolean(canSeeUnapproved)));
});
