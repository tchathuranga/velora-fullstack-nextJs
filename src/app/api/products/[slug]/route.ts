import { getSession, requireSeller } from "@/server/auth";
import { queryOne } from "@/server/db";
import { forbidden, notFound, ok, parseBody, route } from "@/server/http";
import { PRODUCT_COLUMNS, assertSubcategoryMatches, productValues } from "@/server/products";
import { ProductRow, productSelect, toProduct } from "@/server/serializers";
import { createProductSchema } from "@/server/validation";

/**
 * One product with its full photo gallery. Ended listings and listings from stores that aren't approved are
 * invisible to the public; the owning seller (and admins) can still open them to edit or relist.
 */
export const GET = route(async (req, ctx: RouteContext<"/api/products/[slug]">) => {
  const { slug } = await ctx.params;
  const row = await queryOne<ProductRow & { store_status: string; owner_id: string }>(
    `SELECT ${productSelect(true)}, s.status AS store_status, s.owner_id
       FROM products p JOIN stores s ON s.id = p.store_id
      WHERE p.slug = $1`,
    [slug],
  );
  if (!row) throw notFound("Product not found.");

  if (row.status !== "active" || row.store_status !== "active") {
    const session = await getSession(req);
    const canSee = session && (session.role === "admin" || session.userId === row.owner_id);
    if (!canSee) throw notFound("Product not found.");
  }
  return ok(toProduct(row));
});

/** The owning seller edits any of their listings (active or ended) — including restocking an out-of-stock one. */
export const PATCH = route(async (req, ctx: RouteContext<"/api/products/[slug]">) => {
  const session = await requireSeller(req);
  const { slug } = await ctx.params;
  const input = await parseBody(req, createProductSchema);
  await assertSubcategoryMatches(input);

  const existing = await queryOne<{ id: string; store_id: string }>("SELECT id, store_id FROM products WHERE slug = $1", [slug]);
  if (!existing) throw notFound("Product not found.");
  if (existing.store_id !== session.storeId) throw forbidden("You can only edit your own listings.");

  const sets = PRODUCT_COLUMNS.map((column, i) => `${column} = $${i + 2}`).join(", ");
  await queryOne(`UPDATE products SET ${sets} WHERE id = $1`, [existing.id, ...productValues(input)]);

  const row = await queryOne<ProductRow>(`SELECT ${productSelect(true)} FROM products p WHERE p.id = $1`, [existing.id]);
  return ok(toProduct(row!));
});
