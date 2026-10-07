import { requireAdmin } from "@/server/auth";
import { query } from "@/server/db";
import { ok, route } from "@/server/http";
import { BuyerRow, toBuyer } from "@/server/serializers";

/** Registered accounts only (guest checkouts never appear). */
export const GET = route(async (req) => {
  await requireAdmin(req);
  const rows = await query<BuyerRow>(
    `SELECT u.id, u.name, u.email, u.status,
            CASE WHEN a.user_id IS NULL THEN NULL ELSE jsonb_build_object(
              'fullName', a.full_name, 'street', a.street, 'city', a.city, 'province', a.province,
              'phone1', a.phone1, 'phone2', a.phone2, 'zipCode', a.zip_code, 'email', a.email) END AS address
       FROM users u LEFT JOIN user_addresses a ON a.user_id = u.id
      WHERE u.role = 'buyer' ORDER BY u.created_at DESC`,
  );
  return ok(rows.map(toBuyer));
});
