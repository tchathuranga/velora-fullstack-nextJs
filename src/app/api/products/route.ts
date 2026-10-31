import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { requireSeller } from "@/server/auth";
import { query, queryOne } from "@/server/db";
import { ok, parseBody, route } from "@/server/http";
import { PRODUCT_COLUMNS, assertSubcategoryMatches, productValues } from "@/server/products";
import { ProductRow, productSelect, toProduct } from "@/server/serializers";
import { createProductSchema, slugify } from "@/server/validation";

/** Public catalog (approved stores, active listings only), newest first. Photos are trimmed to the cover image. */
export const GET = route(async () => {
  const rows = await query<ProductRow>(
    `SELECT ${productSelect(false)}
       FROM products p JOIN stores s ON s.id = p.store_id AND s.status = 'active'
      WHERE p.status = 'active'
      ORDER BY p.created_at DESC`,
  );
  return ok(rows.map(toProduct));
});

/** An approved seller lists a new product in their own store. */
export const POST = route(async (req) => {
  const session = await requireSeller(req);
  const input = await parseBody(req, createProductSchema);
  await assertSubcategoryMatches(input);

  const slug = `${slugify(input.title, "product")}-${randomBytes(3).toString("hex")}`;
  const columns = ["slug", "store_id", ...PRODUCT_COLUMNS];
  const created = await queryOne<{ id: string }>(
    `INSERT INTO products (${columns.join(", ")})
     VALUES (${columns.map((_, i) => `$${i + 1}`).join(", ")})
     RETURNING id`,
    [slug, session.storeId, ...productValues(input)],
  );

  const row = await queryOne<ProductRow>(`SELECT ${productSelect(false)} FROM products p WHERE p.id = $1`, [created!.id]);
  return NextResponse.json(toProduct(row!), { status: 201 });
});
