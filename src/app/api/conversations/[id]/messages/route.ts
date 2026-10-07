import { NextResponse } from "next/server";
import { requireSession } from "@/server/auth";
import { queryOne } from "@/server/db";
import { forbidden, isUuid, notFound, parseBody, route } from "@/server/http";
import { messageSchema } from "@/server/validation";

/** Posts a message as the buyer or as the owning store's seller, whichever the caller is in this conversation. */
export const POST = route(async (req, ctx: RouteContext<"/api/conversations/[id]/messages">) => {
  const session = await requireSession(req);
  const { id } = await ctx.params;
  const { text } = await parseBody(req, messageSchema);
  if (!isUuid(id)) throw notFound("Conversation not found.");

  const conversation = await queryOne<{ buyer_id: string; store_id: string }>(
    "SELECT buyer_id, store_id FROM conversations WHERE id = $1",
    [id],
  );
  if (!conversation) throw notFound("Conversation not found.");

  const sender =
    conversation.buyer_id === session.userId ? "buyer" : session.storeId === conversation.store_id ? "seller" : null;
  if (!sender) throw forbidden();

  const message = await queryOne<{ id: string; sender: string; text: string; timestamp: Date }>(
    `INSERT INTO messages (conversation_id, sender, text) VALUES ($1, $2, $3)
     RETURNING id, sender, text, created_at AS timestamp`,
    [id, sender, text],
  );
  return NextResponse.json({ ...message, timestamp: message!.timestamp.toISOString() }, { status: 201 });
});
