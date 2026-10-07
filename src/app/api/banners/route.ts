import { query } from "@/server/db";
import { ok, route } from "@/server/http";
import { BannerRow, toBanner } from "@/server/serializers";

export const GET = route(async () => {
  const rows = await query<BannerRow>("SELECT id, title, subtitle, image_url FROM banners ORDER BY position, id");
  return ok(rows.map(toBanner));
});
