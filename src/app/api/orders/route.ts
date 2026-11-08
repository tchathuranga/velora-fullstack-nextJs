import { NextRequest, NextResponse } from "next/server";
import { requireBuyer, requireSession } from "@/server/auth";
import { withTransaction } from "@/server/db";
import { badRequest, conflict, forbidden, ok, parseBody, route } from "@/server/http";
import { notify } from "@/server/notifications";
import { loadOrders } from "@/server/orders";
import { placeOrderSchema } from "@/server/validation";
import { addDays, shippingCost, todayInColombo } from "@/lib/shipping";
import { TRANSACTION_FEE_RATE, variationLabel } from "@/lib/utils";
import type { PaymentMethod, ProductVariations } from "@/types";

interface LockedProduct {
  id: string;
  store_id: string;
  title: string;
  price: number;
  quantity: number;
  delivery_fee: number;
  extra_delivery_fee: number;
  free_delivery: boolean;
  payment_methods: PaymentMethod[];
  icon: string;
  handling_days_max: number;
  variations: ProductVariations | null;
}

interface Line {
  product: LockedProduct;
  variationId: string | null;
  variation: Record<string, string> | null;
  price: number;
  quantity: number;
  shipping: number;
}

/**
 * Places an order. Only signed-in buyers can check out. Prices, shipping and stock are all taken from the database —
 * only product ids, variation ids and quantities are trusted from the client.
 */
export const POST = route(async (req: NextRequest) => {
  const session = await requireBuyer(req);
  const input = await parseBody(req, placeOrderSchema);

  // Collapse accidental duplicate lines so each product / variation is checked and decremented once.
  const wanted = new Map<string, { productId: string; variationId: string | null; quantity: number }>();
  for (const { productId, variationId, quantity } of input.items) {
    const key = `${productId}|${variationId ?? ""}`;
    const existing = wanted.get(key);
    if (existing) existing.quantity += quantity;
    else wanted.set(key, { productId, variationId: variationId ?? null, quantity });
  }
  const productIds = [...new Set([...wanted.values()].map((w) => w.productId))];

  const orderId = await withTransaction(async (client) => {
    const { rows: products } = await client.query<LockedProduct>(
      `SELECT p.id, p.store_id, p.title, p.price, p.quantity, p.delivery_fee, p.extra_delivery_fee, p.free_delivery,
              p.payment_methods, p.icon, p.handling_days_max, product_variations_json(p.id) AS variations
         FROM products p JOIN stores s ON s.id = p.store_id AND s.status = 'active'
        WHERE p.id = ANY($1::uuid[]) AND p.status = 'active'
        ORDER BY p.id
          FOR UPDATE OF p`,
      [productIds],
    );
    if (products.length !== productIds.length) throw conflict("Some items in your order are no longer available.");
    const byId = new Map(products.map((p) => [p.id, p]));

    for (const p of products) {
      if (!p.payment_methods.includes(input.paymentMethod)) {
        throw badRequest(`"${p.title}" doesn't accept ${input.paymentMethod === "cod" ? "cash on delivery" : "bank transfer"}.`);
      }
    }

    // Price and stock-check every line against the product (or the chosen variation).
    const lines: Line[] = [];
    const requested = new Map<string, { productId: string; variationId: string | null; quantity: number }>();
    for (const w of wanted.values()) {
      // A listing without variations has a single stock count, whatever variation id the client sent.
      const variationId = byId.get(w.productId)!.variations?.combinations.length ? w.variationId : null;
      const key = `${w.productId}|${variationId ?? ""}`;
      const existing = requested.get(key);
      if (existing) existing.quantity += w.quantity;
      else requested.set(key, { ...w, variationId });
    }
    for (const w of requested.values()) {
      const product = byId.get(w.productId)!;
      const combinations = product.variations?.combinations ?? [];
      let stock = product.quantity;
      let price = product.price;
      let variation: Record<string, string> | null = null;
      let variationId: string | null = null;

      if (combinations.length > 0) {
        if (!w.variationId) throw badRequest(`Please choose an option for "${product.title}".`);
        const combo = combinations.find((c) => c.id === w.variationId);
        if (!combo) throw conflict(`That option of "${product.title}" is no longer available.`);
        stock = combo.quantity;
        price = combo.price;
        variation = combo.values;
        variationId = combo.id;
      }

      const label = variation ? `"${product.title}" (${variationLabel(variation)})` : `"${product.title}"`;
      if (stock < w.quantity) throw conflict(stock === 0 ? `${label} is out of stock.` : `Only ${stock} of ${label} left in stock.`);
      lines.push({ product, variationId, variation, price, quantity: w.quantity, shipping: 0 });
    }

    // Shipping is per listing: first unit + extra for each further unit, however the units are split across variations.
    for (const product of products) {
      const own = lines.filter((l) => l.product.id === product.id);
      const total = own.reduce((sum, l) => sum + l.quantity, 0);
      own[0].shipping = shippingCost(
        { freeDelivery: product.free_delivery, deliveryFee: product.delivery_fee, extraDeliveryFee: product.extra_delivery_fee },
        total,
      );
    }

    const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
    const deliveryCost = lines.reduce((sum, l) => sum + l.shipping, 0);
    const today = todayInColombo();
    const address = input.billing;

    const { rows: seq } = await client.query<{ n: string }>("SELECT nextval('order_number_seq') AS n");
    const id = `ORD-${seq[0].n}`;
    await client.query(
      `INSERT INTO orders (id, buyer_id, buyer_name, subtotal, delivery_cost, total, payment_method,
                           billing_full_name, billing_street, billing_city, billing_province, billing_phone1, billing_phone2,
                           billing_zip_code, billing_email, order_note, save_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
      [
        id,
        session.userId,
        input.billing.fullName,
        subtotal,
        deliveryCost,
        subtotal + deliveryCost,
        input.paymentMethod,
        address.fullName,
        address.street,
        address.city,
        address.province,
        address.phone1,
        address.phone2,
        address.zipCode,
        address.email || null,
        input.orderNote ?? "",
        input.saveAddress,
      ],
    );
    await client.query("INSERT INTO order_events (order_id, type, occurred_on) VALUES ($1, 'placed', $2)", [id, today]);

    for (const [index, line] of lines.entries()) {
      const { product } = line;
      const shipBy = product.handling_days_max > 0 ? addDays(today, product.handling_days_max) : null;
      const { rows } = await client.query<{ id: string }>(
        `INSERT INTO order_items (order_id, product_id, store_id, title, price, quantity, icon, variation, variation_id,
                                  shipping_cost, ship_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
        [
          id,
          product.id,
          product.store_id,
          product.title,
          line.price,
          line.quantity,
          product.icon,
          line.variation ? JSON.stringify(line.variation) : null,
          line.variationId,
          line.shipping,
          shipBy,
        ],
      );
      // The commission is recorded as charged, so a later change of the rate never rewrites past sales.
      const amount = line.price * line.quantity + line.shipping;
      await client.query(
        `INSERT INTO seller_transactions (id, order_item_id, store_id, product_title, payment_method, amount, fee_rate, fee_amount)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [`TXN-${id.slice(4)}-${index + 1}`, rows[0].id, product.store_id, product.title, input.paymentMethod, amount, TRANSACTION_FEE_RATE, Math.round(amount * TRANSACTION_FEE_RATE * 100) / 100],
      );
    }

    // Decrement stock. Variation listings count stock per variant (the database keeps the listing total in step, and
    // refuses to go below zero); other listings have a single count.
    for (const product of products) {
      const own = lines.filter((l) => l.product.id === product.id);
      if (product.variations?.combinations.length) {
        for (const l of own) {
          await client.query("UPDATE product_variants SET quantity = quantity - $3 WHERE product_id = $1 AND id = $2", [product.id, l.variationId, l.quantity]);
        }
      } else {
        const units = own.reduce((sum, l) => sum + l.quantity, 0);
        await client.query("UPDATE products SET quantity = quantity - $2 WHERE id = $1", [product.id, units]);
      }
    }

    if (input.saveAddress) {
      const a = input.billing;
      await client.query(
        `INSERT INTO user_addresses (user_id, full_name, street, city, province, phone1, phone2, zip_code, email)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (user_id) WHERE is_default DO UPDATE SET full_name = $2, street = $3, city = $4, province = $5,
           phone1 = $6, phone2 = $7, zip_code = $8, email = $9, updated_at = now()`,
        [session.userId, a.fullName, a.street, a.city, a.province, a.phone1, a.phone2, a.zipCode, a.email || null],
      );
    }

    // Tell each seller they have a new order.
    const storeIds = [...new Set(products.map((p) => p.store_id))];
    const { rows: owners } = await client.query<{ id: string; owner_id: string }>(
      "SELECT id, owner_id FROM stores WHERE id = ANY($1::uuid[])",
      [storeIds],
    );
    for (const owner of owners) {
      const units = lines.filter((l) => l.product.store_id === owner.id).reduce((sum, l) => sum + l.quantity, 0);
      await notify(
        {
          userId: owner.owner_id,
          type: "order",
          title: `New order ${id}`,
          body: `${session.username} ordered ${units} ${units === 1 ? "item" : "items"} from your store.`,
          link: `/seller/orders/${id}`,
        },
        client,
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
