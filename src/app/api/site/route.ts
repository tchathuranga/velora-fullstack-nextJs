import { query } from "@/server/db";
import { ok, route } from "@/server/http";
import type { SiteConfig } from "@/types";

const DEFAULTS: SiteConfig = {
  siteContact: { email: "", phone: "", whatsapp: "" },
  adminBankAccounts: [],
};

/** Public contact details and the bank accounts buyers pay into; empty until an admin configures them. */
export const GET = route(async () => {
  const rows = await query<{ key: keyof SiteConfig; value: never }>("SELECT key, value FROM site_settings");
  const config: SiteConfig = { ...DEFAULTS };
  for (const row of rows) {
    if (row.key in DEFAULTS) (config[row.key] as unknown) = row.value;
  }
  return ok(config);
});
