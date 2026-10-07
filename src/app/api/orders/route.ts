import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getSession, requireSession } from "@/server/auth";
import { withTransaction } from "@/server/db";
import { badRequest, conflict, forbidden, isUniqueViolation, ok, parseBody, route } from "@/server/http";
import { loadOrders } from "@/server/orders";
import { placeOrderSchema } from "@/server/validation";
import type { PaymentMethod } from "@/types";

const ID_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomId(length: number): string {
  const bytes = randomBytes(length);
  return Array.from(bytes, (b) => ID_ALPHABET[b % ID_ALPHABET.length]).join("");
}

interface LockedProduct {
  id: string;
  store_id: string;
  title: string;
  price: number;
  quantity: number;
  delivery_fee: number;
  free_delivery: boolean;
  payment_methods: PaymentMethod[];
  icon: string;
}

/**
 * Places an order. Guests may check out; signed-in buyers get it attached to their account. Prices, delivery
 * fees and stock are all taken from the database — only product ids and quantities are trusted from the client.
 */
export const POST = route(async (req: NextRequest) => {
  const session = await getSession(req);
  if (session?.role === "admin") throw forbidden("Admin accounts can't place orders.");
  const input = await parseBody(req, placeOrderSchema);

  // Collapse accidental duplicate lines so each product is locked, priced and decremented once.
  const quantities = new Map<string, number>();
  for (const { productId, quantity } of input.items) quantities.set(productId, (quantities.get(productId) ?? 0) + quantity);

  const orderId = await withTransaction(async (client) => {
    const { rows: products } = await client.query<LockedProduct>(
      `SELECT p.id, p.store_id, p.title, p.price, p.quantity, p.delivery_fee, p.free_delivery, p.payment_methods, p.icon
         FROM products p JOIN stores s ON s.id = p.store_id AND s.status = 'active'
        WHERE p.id = ANY($1::uuid[])
        ORDER BY p.id
          FOR UPDATE OF p`,
      [[...quantities.keys()]],
    );
    if (products.length !== quantities.size) throw conflict("Some items in your cart are no longer available.");

    for (const p of products) {
      const wanted = quantities.get(p.id)!;
      if (p.quantity < wanted) {
        throw conflict(p.quantity === 0 ? `"${p.title}" is out of stock.` : `Only ${p.quantity} of "${p.title}" left in stock.`);
      }
      if (!p.payment_methods.includes(input.paymentMethod)) {
        throw badRequest(`"${p.title}" doesn't accept ${input.paymentMethod === "cod" ? "cash on delivery" : "bank transfer"}.`);
      }
    }

    const subtotal = products.reduce((sum, p) => sum + p.price * quantities.get(p.id)!, 0);
    const deliveryCost = products.reduce((sum, p) => sum + (p.free_delivery ? 0 : p.delivery_fee), 0);
    const today = new Date().toISOString().slice(0, 10);
    const trackingSteps = [
      { label: "Order placed", done: true, date: today },
      { label: "Handed to courier", done: false },
      { label: "Out for delivery", done: false },
      { label: "Delivered", done: false },
    ];
    const billing = { ...input.billing, email: input.billing.email || undefined };

    let id = "";
    for (let attempt = 0; ; attempt += 1) {
      id = `ORD-${randomId(8)}`;
      try {
        await client.query("SAVEPOINT order_insert");
        await client.query(
          `INSERT INTO orders (id, buyer_id, buyer_name, subtotal, delivery_cost, total, payment_method, billing,
                               order_note, save_address, tracking_steps)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            id,
            session?.userId ?? null,
            input.billing.fullName,
            subtotal,
            deliveryCost,
            subtotal + deliveryCost,
            input.paymentMethod,
            JSON.stringify(billing),
            input.orderNote ?? "",
            Boolean(session && input.saveAddress),
            JSON.stringify(trackingSteps),
          ],
        );
        break;
      } catch (err) {
        await client.query("ROLLBACK TO SAVEPOINT order_insert");
        if (!isUniqueViolation(err) || attempt >= 3) throw err;
      }
    }

    for (const [index, p] of products.entries()) {
      const quantity = quantities.get(p.id)!;
      const { rows } = await client.query<{ id: string }>(
        `INSERT INTO order_items (order_id, product_id, store_id, title, price, quantity, icon)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [id, p.id, p.store_id, p.title, p.price, quantity, p.icon],
      );
      await client.query(
        `INSERT INTO seller_transactions (id, order_item_id, store_id, product_title, payment_method, amount)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [`TXN-${id.slice(4)}-${index + 1}`, rows[0].id, p.store_id, p.title, input.paymentMethod, p.price * quantity],
      );
      await client.query("UPDATE products SET quantity = quantity - $2 WHERE id = $1", [p.id, quantity]);
    }

    if (session && input.saveAddress) {
      const a = input.billing;
      await client.query(
        `INSERT INTO user_addresses (user_id, full_name, street, city, province, phone1, phone2, zip_code, email)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (user_id) DO UPDATE SET full_name = $2, street = $3, city = $4, province = $5,
           phone1 = $6, phone2 = $7, zip_code = $8, email = $9, updated_at = now()`,
        [session.userId, a.fullName, a.street, a.city, a.province, a.phone1, a.phone2, a.zipCode, a.email || null],
      );
    }

    return id;
  });

  const [order] = await loadOrders("o.id = $1", [orderId]);
  return NextResponse.json(order, { status: 201 });
});

/** `?as=seller` lists orders containing the signed-in seller's products (their items only); otherwise the buyer's own orders. */
export const GET = route(async (req: NextRequest) => {
  const session = await requireSession(req);

  if (req.nextUrl.searchParams.get("as") === "seller") {
    if (session.role !== "seller" || !session.storeId) throw forbidden("Only approved sellers can view store orders.");
    return ok(
      await loadOrders(
        "EXISTS (SELECT 1 FROM order_items x WHERE x.order_id = o.id AND x.store_id = $1)",
        [session.storeId],
        session.storeId,
      ),
    );
  }

  if (session.role === "admin") throw forbidden();
  return ok(await loadOrders("o.buyer_id = $1", [session.userId]));
});
