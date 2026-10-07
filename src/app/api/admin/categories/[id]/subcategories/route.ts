import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth";
import { queryOne } from "@/server/db";
import { conflict, isUniqueViolation, isUuid, notFound, parseBody, route } from "@/server/http";
import { nameSchema, slugify } from "@/server/validation";

export const POST = route(async (req, ctx: RouteContext<"/api/admin/categories/[id]/subcategories">) => {
  await requireAdmin(req);
  const { id } = await ctx.params;
  const { name } = await parseBody(req, nameSchema);
  if (!isUuid(id) || !(await queryOne("SELECT 1 FROM categories WHERE id = $1", [id]))) throw notFound("Category not found.");

  try {
    const row = await queryOne<{ id: string; name: string; slug: string }>(
      `INSERT INTO subcategories (category_id, name, slug, position)
       VALUES ($1, $2, $3, COALESCE((SELECT max(position) + 1 FROM subcategories WHERE category_id = $1), 0))
       RETURNING id, name, slug`,
      [id, name, slugify(name, "subcategory")],
    );
    return NextResponse.json(row, { status: 201 });
  } catch (err) {
    if (isUniqueViolation(err)) throw conflict("That subcategory already exists.");
    throw err;
  }
});
