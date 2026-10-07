import { requireAdmin } from "@/server/auth";
import { queryOne } from "@/server/db";
import { conflict, isUniqueViolation, isUuid, notFound, ok, parseBody, route } from "@/server/http";
import { nameSchema, slugify } from "@/server/validation";

export const PATCH = route(async (req, ctx: RouteContext<"/api/admin/categories/[id]">) => {
  await requireAdmin(req);
  const { id } = await ctx.params;
  const { name } = await parseBody(req, nameSchema);
  if (!isUuid(id)) throw notFound("Category not found.");

  try {
    const row = await queryOne("UPDATE categories SET name = $2, slug = $3 WHERE id = $1 RETURNING id", [
      id,
      name,
      slugify(name, "category"),
    ]);
    if (!row) throw notFound("Category not found.");
  } catch (err) {
    if (isUniqueViolation(err)) throw conflict("A category with that name already exists.");
    throw err;
  }
  return ok({ ok: true });
});

/** Products in the category keep existing (their category link is cleared). */
export const DELETE = route(async (req, ctx: RouteContext<"/api/admin/categories/[id]">) => {
  await requireAdmin(req);
  const { id } = await ctx.params;
  if (!isUuid(id)) throw notFound("Category not found.");
  const row = await queryOne("DELETE FROM categories WHERE id = $1 RETURNING id", [id]);
  if (!row) throw notFound("Category not found.");
  return ok({ ok: true });
});
