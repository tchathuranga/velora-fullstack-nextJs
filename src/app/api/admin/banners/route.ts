import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth";
import { queryOne } from "@/server/db";
import { parseBody, route } from "@/server/http";
import { BannerRow, toBanner } from "@/server/serializers";
import { bannerCreateSchema } from "@/server/validation";

export const POST = route(async (req) => {
  await requireAdmin(req);
  const { title } = await parseBody(req, bannerCreateSchema);
  const row = await queryOne<BannerRow>(
    `INSERT INTO banners (title, position) VALUES ($1, COALESCE((SELECT max(position) + 1 FROM banners), 0))
     RETURNING id, title, subtitle, image_url`,
    [title],
  );
  return NextResponse.json(toBanner(row!), { status: 201 });
});
