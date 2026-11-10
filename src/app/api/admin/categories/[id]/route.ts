import { audit } from "@/server/audit";
import { requireAdmin } from "@/server/auth";
import { queryOne } from "@/server/db";
import { conflict, isUniqueViolation, isUuid, notFound, ok, parseBody, route } from "@/server/http";
import { categoryUpdateSchema, slugify } from "@/server/validation";

export const PATCH = route(async (req, ctx: RouteContext<"/api/admin/categories/[id]">) => {
  await requireAdmin(req);
  const { id } = await ctx.params;
  const { name, imageUrl } = await parseBody(req, categoryUpdateSchema);
  if (!isUuid(id)) throw notFound("Category not found.");

  try {
    // Only the fields sent are changed; imageUrl: null removes the uploaded photo.
    const row = await queryOne(
      `UPDATE categories SET
         name = COALESCE($2, name),
         slug = COALESCE($3, slug),
         image_url = CASE WHEN $4::boolean THEN $5 ELSE image_url END
       WHERE id = $1 RETURNING id`,
      [id, name ?? null, name ? slugify(name, "category") : null, imageUrl !== undefined, imageUrl ?? null],
    );
    if (!row) throw notFound("Category not found.");
  } catch (err) {
    if (isUniqueViolation(err)) throw conflict("A category with that name already exists.");
    throw err;
  }
  return ok({ ok: true });
});

/** Products in the category keep existing (their category link is cleared). */
export const DELETE = route(async (req, ctx: RouteContext<"/api/admin/categories/[id]">) => {
  const session = await requireAdmin(req);
  const { id } = await ctx.params;
  if (!isUuid(id)) throw notFound("Category not found.");
  const row = await queryOne<{ name: string }>("DELETE FROM categories WHERE id = $1 RETURNING name", [id]);
  if (!row) throw notFound("Category not found.");
  await audit(session, "category.deleted", "category", id, { name: row.name });
  return ok({ ok: true });
});
