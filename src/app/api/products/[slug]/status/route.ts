import { requireSeller } from "@/server/auth";
import { queryOne } from "@/server/db";
import { forbidden, notFound, ok, parseBody, route } from "@/server/http";
import { ProductRow, productSelect, toProduct } from "@/server/serializers";
import { productStatusSchema } from "@/server/validation";

/** "End listing" (status = ended → Unsold, hidden from the marketplace) and "Relist" (status = active). */
export const PUT = route(async (req, ctx: RouteContext<"/api/products/[slug]/status">) => {
  const session = await requireSeller(req);
  const { slug } = await ctx.params;
  const { status } = await parseBody(req, productStatusSchema);

  const existing = await queryOne<{ id: string; store_id: string }>("SELECT id, store_id FROM products WHERE slug = $1", [slug]);
  if (!existing) throw notFound("Product not found.");
  if (existing.store_id !== session.storeId) throw forbidden("You can only manage your own listings.");

  await queryOne("UPDATE products SET status = $2 WHERE id = $1", [existing.id, status]);
  const row = await queryOne<ProductRow>(`SELECT ${productSelect(false)} FROM products p WHERE p.id = $1`, [existing.id]);
  return ok(toProduct(row!));
});
