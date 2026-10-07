import { loadSession, requireBuyer, sessionPayload } from "@/server/auth";
import { query } from "@/server/db";
import { ok, parseBody, route } from "@/server/http";
import { addressSchema } from "@/server/validation";

/** Saves (or replaces) the signed-in buyer's delivery address. */
export const PUT = route(async (req) => {
  const session = await requireBuyer(req);
  const a = await parseBody(req, addressSchema);

  await query(
    `INSERT INTO user_addresses (user_id, full_name, street, city, province, phone1, phone2, zip_code, email)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (user_id) DO UPDATE SET full_name = $2, street = $3, city = $4, province = $5,
       phone1 = $6, phone2 = $7, zip_code = $8, email = $9, updated_at = now()`,
    [session.userId, a.fullName, a.street, a.city, a.province, a.phone1, a.phone2, a.zipCode, a.email || null],
  );

  return ok(sessionPayload(await loadSession(session.userId)));
});
