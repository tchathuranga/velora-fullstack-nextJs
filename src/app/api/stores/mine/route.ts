import { requireSession } from "@/server/auth";
import { query, queryOne } from "@/server/db";
import { ok, parseBody, route } from "@/server/http";
import { STORE_SELECT, StoreRow, toStore } from "@/server/serializers";
import { storeImagesSchema } from "@/server/validation";

/** The signed-in account's own store in any status, including private details. `store` is null when they have none. */
export const GET = route(async (req) => {
  const session = await requireSession(req);
  const row = await queryOne<StoreRow>(`SELECT ${STORE_SELECT} FROM stores s WHERE s.owner_id = $1`, [session.userId]);
  return ok({ store: row ? toStore(row, true) : null });
});

/** The store's owner sets, replaces or removes (null) the store's profile image and/or cover photo. */
export const PATCH = route(async (req) => {
  const session = await requireSession(req);
  const input = await parseBody(req, storeImagesSchema);

  await query(
    `UPDATE stores
        SET profile_image_url = CASE WHEN $2 THEN $3 ELSE profile_image_url END,
            cover_image_url   = CASE WHEN $4 THEN $5 ELSE cover_image_url END
      WHERE owner_id = $1`,
    [
      session.userId,
      input.profileImage !== undefined,
      input.profileImage ?? null,
      input.coverImage !== undefined,
      input.coverImage ?? null,
    ],
  );

  const row = await queryOne<StoreRow>(`SELECT ${STORE_SELECT} FROM stores s WHERE s.owner_id = $1`, [session.userId]);
  return ok({ store: row ? toStore(row, true) : null });
});
