import { loadSession, requireSession, sessionPayload } from "@/server/auth";
import { query } from "@/server/db";
import { ok, parseBody, route } from "@/server/http";
import { profileImagesSchema } from "@/server/validation";

/** Sets, replaces or removes (null) the signed-in account's profile picture and/or cover photo. */
export const PATCH = route(async (req) => {
  const session = await requireSession(req);
  const input = await parseBody(req, profileImagesSchema);

  await query(
    `UPDATE users
        SET avatar_url = CASE WHEN $2 THEN $3 ELSE avatar_url END,
            cover_url  = CASE WHEN $4 THEN $5 ELSE cover_url END
      WHERE id = $1`,
    [
      session.userId,
      input.avatarUrl !== undefined,
      input.avatarUrl ?? null,
      input.coverUrl !== undefined,
      input.coverUrl ?? null,
    ],
  );

  return ok(sessionPayload(await loadSession(session.userId)));
});
