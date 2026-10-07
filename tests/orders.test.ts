import { beforeAll, describe, expect, it } from "vitest";
import { GET as getOrder } from "@/app/api/orders/[id]/route";
import { GET as listOrders, POST as placeOrder } from "@/app/api/orders/route";
import { billing, call, createProduct, createStore, createUser, params, query, queryOne } from "./helpers/api";

let seller: Awaited<ReturnType<typeof createUser>>;
let buyer: Awaited<ReturnType<typeof createUser>>;
let store: { id: string };

beforeAll(async () => {
  seller = await createUser();
  buyer = await createUser();
  store = await createStore(seller.id);
});

const order = (body: unknown, cookie?: string) => call(placeOrder, "/api/orders", { method: "POST", body, cookie });
const stock = async (id: string) => (await queryOne<{ quantity: number }>("SELECT quantity FROM products WHERE id = $1", [id]))!.quantity;

describe("POST /api/orders", () => {
  it("prices from the database, decrements stock and records items + seller transactions", async () => {
    const a = await createProduct(store.id, { price: 1500, quantity: 5, deliveryFee: 300 });
    const b = await createProduct(store.id, { price: 400, quantity: 3, freeDelivery: true });

    const res = await order(
      { items: [{ productId: a.id, quantity: 2 }, { productId: b.id, quantity: 1 }], paymentMethod: "cod", billing },
      buyer.cookie,
    );
    expect(res.status).toBe(201);
    expect(res.json).toMatchObject({ subtotal: 3400, deliveryCost: 300, total: 3700, paymentMethod: "cod", status: "processing" });
    expect(res.json.id).toMatch(/^ORD-[A-Z0-9]{8}$/);
    expect(res.json.items).toHaveLength(2);

    expect(await stock(a.id)).toBe(3);
    expect(await stock(b.id)).toBe(2);

    const txns = await query<{ amount: number; confirmed: boolean }>(
      "SELECT amount, confirmed FROM seller_transactions WHERE store_id = $1 AND order_item_id IN (SELECT id FROM order_items WHERE order_id = $2) ORDER BY amount",
      [store.id, res.json.id],
    );
    expect(txns.map((t) => t.amount)).toEqual([400, 3000]);
    expect(txns.every((t) => !t.confirmed)).toBe(true);
  });

  it("merges duplicate cart lines and charges each product once", async () => {
    const p = await createProduct(store.id, { price: 100, quantity: 10, deliveryFee: 50 });
    const res = await order(
      { items: [{ productId: p.id, quantity: 1 }, { productId: p.id, quantity: 2 }], paymentMethod: "cod", billing },
      buyer.cookie,
    );
    expect(res.status).toBe(201);
    expect(res.json.items).toHaveLength(1);
    expect(res.json).toMatchObject({ subtotal: 300, deliveryCost: 50 });
    expect(await stock(p.id)).toBe(7);
  });

  it("rejects orders that exceed stock and leaves stock untouched", async () => {
    const p = await createProduct(store.id, { quantity: 2 });
    const res = await order({ items: [{ productId: p.id, quantity: 3 }], paymentMethod: "cod", billing }, buyer.cookie);
    expect(res.status).toBe(409);
    expect(res.json.error).toMatch(/Only 2/);
    expect(await stock(p.id)).toBe(2);
  });

  it("rolls the whole order back when one line fails", async () => {
    const ok = await createProduct(store.id, { quantity: 5 });
    const empty = await createProduct(store.id, { quantity: 0 });
    const res = await order(
      { items: [{ productId: ok.id, quantity: 1 }, { productId: empty.id, quantity: 1 }], paymentMethod: "cod", billing },
      buyer.cookie,
    );
    expect(res.status).toBe(409);
    expect(res.json.error).toMatch(/out of stock/);
    expect(await stock(ok.id)).toBe(5);
    expect(await queryOne("SELECT 1 FROM order_items WHERE product_id = $1", [ok.id])).toBeNull();
  });

  it("never oversells under concurrent orders", async () => {
    const p = await createProduct(store.id, { quantity: 3 });
    const results = await Promise.all(
      Array.from({ length: 6 }, () => order({ items: [{ productId: p.id, quantity: 1 }], paymentMethod: "cod", billing })),
    );
    expect(results.filter((r) => r.status === 201)).toHaveLength(3);
    expect(results.filter((r) => r.status === 409)).toHaveLength(3);
    expect(await stock(p.id)).toBe(0);
  });

  it("rejects unsupported payment methods, unavailable stores and unknown products", async () => {
    const codOnly = await createProduct(store.id, { paymentMethods: ["cod"] });
    const bt = await order({ items: [{ productId: codOnly.id, quantity: 1 }], paymentMethod: "bank_transfer", billing });
    expect(bt.status).toBe(400);

    const pendingStore = await createStore((await createUser()).id, "under_review");
    const hidden = await createProduct(pendingStore.id);
    const unavailable = await order({ items: [{ productId: hidden.id, quantity: 1 }], paymentMethod: "cod", billing });
    expect(unavailable.status).toBe(409);

    const missing = await order({ items: [{ productId: "00000000-0000-4000-8000-000000000000", quantity: 1 }], paymentMethod: "cod", billing });
    expect(missing.status).toBe(409);
  });

  it("validates the request body and blocks admins", async () => {
    const p = await createProduct(store.id);
    expect((await order({ items: [], paymentMethod: "cod", billing })).status).toBe(400);
    expect((await order({ items: [{ productId: p.id, quantity: 0 }], paymentMethod: "cod", billing })).status).toBe(400);
    expect((await order({ items: [{ productId: p.id, quantity: 1 }], paymentMethod: "cod", billing: { ...billing, city: "" } })).status).toBe(400);

    const admin = await createUser({ role: "admin" });
    const res = await order({ items: [{ productId: p.id, quantity: 1 }], paymentMethod: "cod", billing }, admin.cookie);
    expect(res.status).toBe(403);
  });

  it("saves the billing address for signed-in buyers who ask, but not for guests", async () => {
    const p = await createProduct(store.id);
    const user = await createUser();
    await order({ items: [{ productId: p.id, quantity: 1 }], paymentMethod: "cod", billing, saveAddress: true }, user.cookie);
    const saved = await queryOne<{ city: string }>("SELECT city FROM user_addresses WHERE user_id = $1", [user.id]);
    expect(saved?.city).toBe("Colombo");

    const guest = await order({ items: [{ productId: p.id, quantity: 1 }], paymentMethod: "cod", billing, saveAddress: true });
    expect(guest.status).toBe(201);
    expect(await queryOne("SELECT 1 FROM orders WHERE id = $1 AND buyer_id IS NULL AND save_address = false", [guest.json.id])).not.toBeNull();
  });
});

describe("GET /api/orders", () => {
  it("lists only the signed-in buyer's own orders", async () => {
    const p = await createProduct(store.id);
    const mine = await createUser();
    const other = await createUser();
    const placed = await order({ items: [{ productId: p.id, quantity: 1 }], paymentMethod: "cod", billing }, mine.cookie);
    await order({ items: [{ productId: p.id, quantity: 1 }], paymentMethod: "cod", billing }, other.cookie);

    const res = await call(listOrders, "/api/orders", { cookie: mine.cookie });
    expect(res.status).toBe(200);
    expect(res.json.map((o: { id: string }) => o.id)).toEqual([placed.json.id]);

    expect((await call(listOrders, "/api/orders")).status).toBe(401);
  });

  it("shows sellers only their own store's items, and refuses non-sellers", async () => {
    const otherSeller = await createUser();
    const otherStore = await createStore(otherSeller.id);
    const mine = await createProduct(store.id, { price: 10 });
    const theirs = await createProduct(otherStore.id, { price: 20 });
    const placed = await order(
      { items: [{ productId: mine.id, quantity: 1 }, { productId: theirs.id, quantity: 1 }], paymentMethod: "cod", billing },
      buyer.cookie,
    );

    const res = await call(listOrders, "/api/orders", { cookie: seller.cookie, search: "?as=seller" });
    expect(res.status).toBe(200);
    const found = res.json.find((o: { id: string }) => o.id === placed.json.id);
    expect(found.items).toHaveLength(1);
    expect(found.items[0].productId).toBe(mine.id);

    expect((await call(listOrders, "/api/orders", { cookie: buyer.cookie, search: "?as=seller" })).status).toBe(403);
  });
});

describe("GET /api/orders/[id]", () => {
  it("lets a buyer or admin read an account order, and hides it from other users", async () => {
    const p = await createProduct(store.id);
    const placed = await order({ items: [{ productId: p.id, quantity: 1 }], paymentMethod: "cod", billing }, buyer.cookie);
    const path = `/api/orders/${placed.json.id}`;
    const ctx = params({ id: placed.json.id });

    expect((await call(getOrder, path, { cookie: buyer.cookie }, ctx)).status).toBe(200);
    expect((await call(getOrder, path, { cookie: (await createUser({ role: "admin" })).cookie }, params({ id: placed.json.id }))).status).toBe(200);
    expect((await call(getOrder, path, { cookie: (await createUser()).cookie }, params({ id: placed.json.id }))).status).toBe(404);
    expect((await call(getOrder, path, {}, params({ id: placed.json.id }))).status).toBe(404);
  });

  it("serves guest orders to anyone holding the id, case-insensitively, and 404s unknown ids", async () => {
    const p = await createProduct(store.id);
    const placed = await order({ items: [{ productId: p.id, quantity: 1 }], paymentMethod: "cod", billing });
    const lower = placed.json.id.toLowerCase();

    expect((await call(getOrder, `/api/orders/${lower}`, {}, params({ id: lower }))).status).toBe(200);
    expect((await call(getOrder, "/api/orders/ORD-NOPE", {}, params({ id: "ORD-NOPE" }))).status).toBe(404);
  });
});
