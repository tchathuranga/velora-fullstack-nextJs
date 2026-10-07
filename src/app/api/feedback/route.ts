import { NextRequest, NextResponse } from "next/server";
import { requireBuyer } from "@/server/auth";
import { query, queryOne } from "@/server/db";
import { badRequest, forbidden, isUuid, ok, parseBody, route } from "@/server/http";
import { FeedbackRow, toFeedback } from "@/server/serializers";
import { feedbackSchema } from "@/server/validation";

export const GET = route(async (req: NextRequest) => {
  const productId = req.nextUrl.searchParams.get("productId");
  if (!productId || !isUuid(productId)) throw badRequest("productId is required.");
  const rows = await query<FeedbackRow>(
    "SELECT id, product_id, buyer_name, rating, comment, created_at FROM feedback WHERE product_id = $1 ORDER BY created_at DESC",
    [productId],
  );
  return ok(rows.map(toFeedback));
});

/** Only a buyer who ordered the product can review it (one review per product; resubmitting updates it). */
export const POST = route(async (req) => {
  const session = await requireBuyer(req);
  const { productId, rating, comment } = await parseBody(req, feedbackSchema);

  const purchased = await queryOne(
    `SELECT 1 FROM order_items oi JOIN orders o ON o.id = oi.order_id
      WHERE oi.product_id = $1 AND o.buyer_id = $2 LIMIT 1`,
    [productId, session.userId],
  );
  if (!purchased) throw forbidden("You can only review products you've purchased.");

  const row = await queryOne<FeedbackRow>(
    `INSERT INTO feedback (product_id, buyer_id, buyer_name, rating, comment)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (product_id, buyer_id) DO UPDATE SET rating = $4, comment = $5, buyer_name = $3
     RETURNING id, product_id, buyer_name, rating, comment, created_at`,
    [productId, session.userId, session.name, rating, comment],
  );
  return NextResponse.json(toFeedback(row!), { status: 201 });
});
