import { requireSession } from "@/server/auth";
import { query, queryOne } from "@/server/db";
import { ok, parseBody, route } from "@/server/http";
import { notificationsReadSchema } from "@/server/validation";
import type { AppNotification } from "@/types";

interface NotificationRow {
  id: string;
  type: AppNotification["type"];
  title: string;
  body: string;
  link: string;
  read_at: Date | null;
  created_at: Date;
}

/** The signed-in account's bell-icon notifications, newest first, with the total unread count. */
export const GET = route(async (req) => {
  const session = await requireSession(req);
  const rows = await query<NotificationRow>(
    `SELECT id, type, title, body, link, read_at, created_at FROM notifications
      WHERE user_id = $1 ORDER BY created_at DESC LIMIT 30`,
    [session.userId],
  );
  const unread = await queryOne<{ n: number }>(
    "SELECT count(*)::int AS n FROM notifications WHERE user_id = $1 AND read_at IS NULL",
    [session.userId],
  );
  const notifications: AppNotification[] = rows.map((r) => ({
    id: r.id,
    type: r.type,
    title: r.title,
    body: r.body,
    link: r.link,
    read: r.read_at !== null,
    createdAt: r.created_at.toISOString(),
  }));
  return ok({ notifications, unreadCount: unread?.n ?? 0 });
});

/** Marks the given notifications (or, with no ids, all of them) as read. */
export const POST = route(async (req) => {
  const session = await requireSession(req);
  const { ids } = await parseBody(req, notificationsReadSchema);
  await query(
    `UPDATE notifications SET read_at = now()
      WHERE user_id = $1 AND read_at IS NULL AND ($2::uuid[] IS NULL OR id = ANY($2::uuid[]))`,
    [session.userId, ids ?? null],
  );
  return ok({ ok: true });
});
