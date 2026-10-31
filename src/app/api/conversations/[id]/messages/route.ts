import { NextResponse } from "next/server";
import { requireSession } from "@/server/auth";
import { queryOne } from "@/server/db";
import { forbidden, isUuid, notFound, parseBody, route } from "@/server/http";
import { notify } from "@/server/notifications";
import { messageSchema } from "@/server/validation";

/** Posts a message (text and/or photos) as the buyer or as the owning store's seller, whichever the caller is in this conversation. */
export const POST = route(async (req, ctx: RouteContext<"/api/conversations/[id]/messages">) => {
  const session = await requireSession(req);
  const { id } = await ctx.params;
  const input = await parseBody(req, messageSchema);
  if (!isUuid(id)) throw notFound("Conversation not found.");

  const conversation = await queryOne<{
    buyer_id: string;
    store_id: string;
    owner_id: string;
    buyer_username: string;
    store_name: string;
  }>(
    `SELECT c.buyer_id, c.store_id, s.owner_id, u.username AS buyer_username, s.store_name
       FROM conversations c JOIN stores s ON s.id = c.store_id JOIN users u ON u.id = c.buyer_id
      WHERE c.id = $1`,
    [id],
  );
  if (!conversation) throw notFound("Conversation not found.");

  const sender =
    conversation.buyer_id === session.userId ? "buyer" : session.storeId === conversation.store_id ? "seller" : null;
  if (!sender) throw forbidden();

  // Attach the listing / order only when it really belongs to this conversation.
  const product = input.productId
    ? await queryOne<{ id: string }>("SELECT id FROM products WHERE id = $1 AND store_id = $2", [input.productId, conversation.store_id])
    : null;
  const order = input.orderId
    ? await queryOne<{ id: string }>(
        `SELECT o.id FROM orders o
          WHERE o.id = $1 AND o.buyer_id = $2 AND EXISTS (SELECT 1 FROM order_items x WHERE x.order_id = o.id AND x.store_id = $3)`,
        [input.orderId.toUpperCase(), conversation.buyer_id, conversation.store_id],
      )
    : null;

  const message = await queryOne<{ id: string; sender: string; text: string; images: string[]; timestamp: Date }>(
    `INSERT INTO messages (conversation_id, sender, text, images, product_id, order_id) VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, sender, text, images, created_at AS timestamp`,
    [id, sender, input.text, JSON.stringify(input.images), product?.id ?? null, order?.id ?? null],
  );

  const preview = input.text || (input.images.length === 1 ? "Sent a photo" : `Sent ${input.images.length} photos`);
  await notify(
    sender === "buyer"
      ? {
          userId: conversation.owner_id,
          type: "message",
          title: `New message from ${conversation.buyer_username}`,
          body: preview,
          link: `/seller/messages?c=${id}`,
        }
      : {
          userId: conversation.buyer_id,
          type: "message",
          title: `New message from ${conversation.store_name}`,
          body: preview,
          link: `/account/messages?c=${id}`,
        },
  );

  return NextResponse.json({ ...message, timestamp: message!.timestamp.toISOString() }, { status: 201 });
});
