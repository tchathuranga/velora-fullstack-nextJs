import type { PoolClient } from "pg";
import { query } from "./db";

interface NewNotification {
  userId: string;
  type: "message" | "order";
  title: string;
  body?: string;
  link?: string;
}

/**
 * Records a bell-icon notification. Pass `client` to make it part of an open transaction.
 * A burst of messages in one conversation refreshes the single unread notification instead of piling up new ones.
 */
export async function notify(n: NewNotification, client?: PoolClient) {
  const exec = async (text: string, params: unknown[]) => (client ? (await client.query(text, params)).rows : query(text, params));
  const params = [n.userId, n.type, n.title, n.body ?? "", n.link ?? ""];

  if (n.type === "message") {
    const refreshed = await exec(
      `UPDATE notifications SET title = $3, body = $4, created_at = now()
        WHERE user_id = $1 AND type = $2 AND link = $5 AND read_at IS NULL
        RETURNING id`,
      params,
    );
    if (refreshed.length > 0) return;
  }

  await exec("INSERT INTO notifications (user_id, type, title, body, link) VALUES ($1, $2, $3, $4, $5)", params);
}
