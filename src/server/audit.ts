import type { PoolClient } from "pg";
import { query } from "./db";

export interface AuditActor {
  userId: string;
  username: string;
}

/**
 * Records an administrator action in the append-only audit_log (who, what, on which record, with what details).
 * Pass the transaction's client to make the entry part of the same transaction as the change it describes.
 */
export async function audit(
  actor: AuditActor,
  action: string,
  entityType: string,
  entityId: string | null,
  details: Record<string, unknown> = {},
  client?: Pick<PoolClient, "query">,
): Promise<void> {
  const sql = "INSERT INTO audit_log (actor_id, actor_username, action, entity_type, entity_id, details) VALUES ($1, $2, $3, $4, $5, $6)";
  const params = [actor.userId, actor.username, action, entityType, entityId, JSON.stringify(details)];
  if (client) await client.query(sql, params);
  else await query(sql, params);
}
