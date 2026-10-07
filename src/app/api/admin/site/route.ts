import { requireAdmin } from "@/server/auth";
import { withTransaction } from "@/server/db";
import { ok, parseBody, route } from "@/server/http";
import { siteSchema } from "@/server/validation";

export const PUT = route(async (req) => {
  await requireAdmin(req);
  const config = await parseBody(req, siteSchema);

  await withTransaction(async (client) => {
    for (const [key, value] of Object.entries(config)) {
      await client.query(
        "INSERT INTO site_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2",
        [key, JSON.stringify(value)],
      );
    }
  });
  return ok(config);
});
