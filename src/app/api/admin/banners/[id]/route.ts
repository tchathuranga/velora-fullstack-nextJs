import { requireAdmin } from "@/server/auth";
import { queryOne } from "@/server/db";
import { isUuid, notFound, ok, parseBody, route } from "@/server/http";
import { BannerRow, toBanner } from "@/server/serializers";
import { bannerUpdateSchema } from "@/server/validation";

export const PATCH = route(async (req, ctx: RouteContext<"/api/admin/banners/[id]">) => {
  await requireAdmin(req);
  const { id } = await ctx.params;
  const input = await parseBody(req, bannerUpdateSchema);
  if (!isUuid(id)) throw notFound("Banner not found.");

  // `imageUrl: null` clears the image; an omitted field is left unchanged.
  const row = await queryOne<BannerRow>(
    `UPDATE banners SET
       title     = COALESCE($2, title),
       subtitle  = COALESCE($3, subtitle),
       image_url = CASE WHEN $4::boolean THEN $5 ELSE image_url END
     WHERE id = $1 RETURNING id, title, subtitle, image_url`,
    [id, input.title ?? null, input.subtitle ?? null, input.imageUrl !== undefined, input.imageUrl ?? null],
  );
  if (!row) throw notFound("Banner not found.");
  return ok(toBanner(row));
});

export const DELETE = route(async (req, ctx: RouteContext<"/api/admin/banners/[id]">) => {
  await requireAdmin(req);
  const { id } = await ctx.params;
  if (!isUuid(id)) throw notFound("Banner not found.");
  const row = await queryOne("DELETE FROM banners WHERE id = $1 RETURNING id", [id]);
  if (!row) throw notFound("Banner not found.");
  return ok({ ok: true });
});
