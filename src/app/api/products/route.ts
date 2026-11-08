import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { requireSeller } from "@/server/auth";
import { query, queryOne, withTransaction } from "@/server/db";
import { badRequest, isUuid, ok, parseBody, route } from "@/server/http";
import { PRODUCT_COLUMNS, assertSubcategoryMatches, productValues, saveVariations } from "@/server/products";
import { ON_SALE_SQL, ProductRow, productSelect, toProduct } from "@/server/serializers";
import { createProductSchema, slugify } from "@/server/validation";

/** The home-page sections, each with the filter and ordering that define it. */
const SECTIONS = {
  new: { where: "p.created_at > now() - interval '30 days'", order: "p.created_at DESC, p.id" },
  deal: { where: "p.last_sold_at IS NOT NULL", order: "p.last_sold_at DESC, p.id" },
  sale: { where: `(${ON_SALE_SQL} OR 'sale' = ANY(p.tags))`, order: "p.created_at DESC, p.id" },
} as const;

/**
 * Public catalog (approved stores, active listings only). Photos are trimmed to the cover image.
 *
 * Without parameters it returns every product as a plain array, newest first (what older clients expect). With `limit`,
 * `ids` or `section` it returns one page as `{ items, total }`:
 *   ?section=new|deal|sale   the home-page sections (new this month / most recently sold / on sale)
 *   ?ids=a,b,c               just these products (max 60)
 *   ?categoryId=... ?storeId=...   filters
 *   ?limit=12 (1-60) &offset=0
 */
export const GET = route(async (req) => {
  const sp = req.nextUrl.searchParams;
  if (!sp.has("limit") && !sp.has("ids") && !sp.has("section")) {
    const all = await query<ProductRow>(
      `SELECT ${productSelect(false)}
         FROM products p JOIN stores s ON s.id = p.store_id AND s.status = 'active'
        WHERE p.status = 'active'
        ORDER BY p.created_at DESC`,
    );
    return ok(all.map(toProduct));
  }

  const sectionName = sp.get("section");
  if (sectionName && !(sectionName in SECTIONS)) throw badRequest("Unknown section.");
  const section = sectionName ? SECTIONS[sectionName as keyof typeof SECTIONS] : null;
  const limit = Math.min(60, Math.max(1, Number.parseInt(sp.get("limit") ?? "12", 10) || 12));
  const offset = Math.max(0, Number.parseInt(sp.get("offset") ?? "0", 10) || 0);

  const where = ["p.status = 'active'"];
  const params: unknown[] = [];
  if (section) where.push(section.where);
  if (sp.has("ids")) {
    const ids = (sp.get("ids") ?? "").split(",").filter(Boolean);
    if (ids.length > 60 || !ids.every(isUuid)) throw badRequest("ids must be up to 60 product ids.");
    params.push(ids);
    where.push(`p.id = ANY($${params.length}::uuid[])`);
  }
  for (const [param, column] of [
    ["categoryId", "p.category_id"],
    ["storeId", "p.store_id"],
  ] as const) {
    const value = sp.get(param);
    if (value === null) continue;
    if (!isUuid(value)) throw badRequest(`${param} must be an id.`);
    params.push(value);
    where.push(`${column} = $${params.length}`);
  }
  params.push(limit, offset);

  const rows = await query<ProductRow & { total_count: number }>(
    `SELECT ${productSelect(false)}, count(*) OVER() AS total_count
       FROM products p JOIN stores s ON s.id = p.store_id AND s.status = 'active'
      WHERE ${where.join(" AND ")}
      ORDER BY ${section?.order ?? "p.created_at DESC, p.id"}
      LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  );
  return ok({ items: rows.map(toProduct), total: rows[0]?.total_count ?? 0 });
});

/** An approved seller lists a new product in their own store. */
export const POST = route(async (req) => {
  const session = await requireSeller(req);
  const input = await parseBody(req, createProductSchema);
  await assertSubcategoryMatches(input);

  const slug = `${slugify(input.title, "product")}-${randomBytes(3).toString("hex")}`;
  const columns = ["slug", "store_id", ...PRODUCT_COLUMNS];
  const createdId = await withTransaction(async (client) => {
    const { rows } = await client.query<{ id: string }>(
      `INSERT INTO products (${columns.join(", ")})
       VALUES (${columns.map((_, i) => `$${i + 1}`).join(", ")})
       RETURNING id`,
      [slug, session.storeId, ...productValues(input)],
    );
    await saveVariations(client, rows[0].id, input.variations);
    return rows[0].id;
  });

  const row = await queryOne<ProductRow>(`SELECT ${productSelect(false)} FROM products p WHERE p.id = $1`, [createdId]);
  return NextResponse.json(toProduct(row!), { status: 201 });
});
