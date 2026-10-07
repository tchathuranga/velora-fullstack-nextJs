import { NextResponse } from "next/server";
import { requireBuyer, requireSession } from "@/server/auth";
import { query, queryOne } from "@/server/db";
import { forbidden, notFound, ok, parseBody, route } from "@/server/http";
import { CONVERSATION_SELECT, ConversationRow, toConversation } from "@/server/serializers";
import { startConversationSchema } from "@/server/validation";

/** Buyers see their own conversations; approved sellers see the ones addressed to their store. */
export const GET = route(async (req) => {
  const session = await requireSession(req);
  if (session.role === "admin") throw forbidden();

  const seller = req.nextUrl.searchParams.get("as") === "seller";
  if (seller && !session.storeId) throw forbidden("Only approved sellers can view store messages.");

  const rows = await query<ConversationRow>(
    `SELECT ${CONVERSATION_SELECT} WHERE ${seller ? "c.store_id" : "c.buyer_id"} = $1
      ORDER BY COALESCE((SELECT max(m.created_at) FROM messages m WHERE m.conversation_id = c.id), c.created_at) DESC`,
    [seller ? session.storeId : session.userId],
  );
  return ok(rows.map(toConversation));
});

/** Finds or creates the buyer's conversation with a store. */
export const POST = route(async (req) => {
  const session = await requireBuyer(req);
  const { storeId } = await parseBody(req, startConversationSchema);

  const store = await queryOne<{ owner_id: string }>("SELECT owner_id FROM stores WHERE id = $1 AND status = 'active'", [storeId]);
  if (!store) throw notFound("Store not found.");
  if (store.owner_id === session.userId) throw forbidden("You can't message your own store.");

  const row = await queryOne<{ id: string }>(
    `INSERT INTO conversations (buyer_id, store_id) VALUES ($1, $2)
     ON CONFLICT (buyer_id, store_id) DO UPDATE SET buyer_id = EXCLUDED.buyer_id RETURNING id`,
    [session.userId, storeId],
  );
  const conversation = await queryOne<ConversationRow>(`SELECT ${CONVERSATION_SELECT} WHERE c.id = $1`, [row!.id]);
  return NextResponse.json(toConversation(conversation!), { status: 201 });
});
