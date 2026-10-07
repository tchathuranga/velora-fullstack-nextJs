import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth";
import { queryOne } from "@/server/db";
import { conflict, isUniqueViolation, parseBody, route } from "@/server/http";
import { CATEGORY_SELECT, CategoryRow, toCategory } from "@/server/serializers";
import { nameSchema, slugify } from "@/server/validation";

export const POST = route(async (req) => {
  await requireAdmin(req);
  const { name } = await parseBody(req, nameSchema);

  try {
    const created = await queryOne<{ id: string }>(
      `INSERT INTO categories (name, slug, position)
       VALUES ($1, $2, COALESCE((SELECT max(position) + 1 FROM categories), 0)) RETURNING id`,
      [name, slugify(name, "category")],
    );
    const row = await queryOne<CategoryRow>(`SELECT ${CATEGORY_SELECT} FROM categories c WHERE c.id = $1`, [created!.id]);
    return NextResponse.json(toCategory(row!), { status: 201 });
  } catch (err) {
    if (isUniqueViolation(err)) throw conflict("A category with that name already exists.");
    throw err;
  }
});
