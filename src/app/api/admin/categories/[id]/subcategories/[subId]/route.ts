import { requireAdmin } from "@/server/auth";
import { queryOne } from "@/server/db";
import { conflict, isUniqueViolation, isUuid, notFound, ok, parseBody, route } from "@/server/http";
import { nameSchema, slugify } from "@/server/validation";

export const PATCH = route(async (req, ctx: RouteContext<"/api/admin/categories/[id]/subcategories/[subId]">) => {
  await requireAdmin(req);
  const { id, subId } = await ctx.params;
  const { name } = await parseBody(req, nameSchema);
  if (!isUuid(id) || !isUuid(subId)) throw notFound("Subcategory not found.");

  try {
    const row = await queryOne(
      "UPDATE subcategories SET name = $3, slug = $4 WHERE id = $2 AND category_id = $1 RETURNING id",
      [id, subId, name, slugify(name, "subcategory")],
    );
    if (!row) throw notFound("Subcategory not found.");
  } catch (err) {
    if (isUniqueViolation(err)) throw conflict("That subcategory already exists.");
    throw err;
  }
  return ok({ ok: true });
});

export const DELETE = route(async (req, ctx: RouteContext<"/api/admin/categories/[id]/subcategories/[subId]">) => {
  await requireAdmin(req);
  const { id, subId } = await ctx.params;
  if (!isUuid(id) || !isUuid(subId)) throw notFound("Subcategory not found.");
  const row = await queryOne("DELETE FROM subcategories WHERE id = $2 AND category_id = $1 RETURNING id", [id, subId]);
  if (!row) throw notFound("Subcategory not found.");
  return ok({ ok: true });
});
