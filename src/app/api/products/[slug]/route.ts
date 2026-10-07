import { queryOne } from "@/server/db";
import { notFound, ok, route } from "@/server/http";
import { ProductRow, productSelect, toProduct } from "@/server/serializers";

/** One product with its full photo gallery. */
export const GET = route(async (_req, ctx: RouteContext<"/api/products/[slug]">) => {
  const { slug } = await ctx.params;
  const row = await queryOne<ProductRow>(
    `SELECT ${productSelect(true)}
       FROM products p JOIN stores s ON s.id = p.store_id AND s.status = 'active'
      WHERE p.slug = $1`,
    [slug],
  );
  if (!row) throw notFound("Product not found.");
  return ok(toProduct(row));
});
