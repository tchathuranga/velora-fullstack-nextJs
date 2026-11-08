import { beforeAll, describe, expect, it } from "vitest";
import { randomBytes } from "node:crypto";
import { PATCH as setBuyerStatus } from "@/app/api/admin/buyers/[id]/route";
import { POST as payout } from "@/app/api/admin/payouts/route";
import { PATCH as setStoreStatus } from "@/app/api/admin/stores/[id]/route";
import { GET as adminStores } from "@/app/api/admin/stores/route";
import { PATCH as confirmTransaction } from "@/app/api/admin/transactions/[id]/route";
import { DELETE as deleteUser } from "@/app/api/admin/users/[id]/route";
import { POST as postFeedback } from "@/app/api/feedback/route";
import { POST as placeOrder } from "@/app/api/orders/route";
import { GET as listProducts } from "@/app/api/products/route";
import { GET as myStore } from "@/app/api/stores/mine/route";
import { GET as publicStores, POST as createStore } from "@/app/api/stores/route";
import { bankKey, decryptJson, encryptJson, isEncrypted } from "../scripts/lib/bank-crypto.mjs";
import { sslFor } from "../scripts/lib/pg-ssl.mjs";
import { sslFor as appSslFor } from "@/server/db-ssl";
import { billing, call, createProduct, createStore as insertStore, createUser, params, query, queryOne } from "./helpers/api";

let seller: Awaited<ReturnType<typeof createUser>>;
let buyer: Awaited<ReturnType<typeof createUser>>;
let admin: Awaited<ReturnType<typeof createUser>>;
let store: { id: string; slug: string };

beforeAll(async () => {
  seller = await createUser();
  buyer = await createUser();
  admin = await createUser({ role: "admin" });
  store = await insertStore(seller.id);
});

const order = (items: unknown[], cookie = buyer.cookie) => call(placeOrder, "/api/orders", { method: "POST", body: { items, paymentMethod: "cod", billing }, cookie });
const productRow = (id: string) =>
  queryOne<{ rating_avg: string; review_count: number; sold_count: number; last_sold_at: Date | null }>("SELECT rating_avg, review_count, sold_count, last_sold_at FROM products WHERE id = $1", [id]);

describe("stored product counters", () => {
  it("keep rating and review count current as feedback is added, changed and removed", async () => {
    const p = await createProduct(store.id);
    expect(await productRow(p.id)).toMatchObject({ review_count: 0 });
    expect(Number((await productRow(p.id))!.rating_avg)).toBe(0);

    await order([{ productId: p.id, quantity: 1 }]);
    const review = (rating: number, who = buyer) => call(postFeedback, "/api/feedback", { method: "POST", cookie: who.cookie, body: { productId: p.id, rating, comment: "ok" } });
    expect((await review(5)).status).toBe(201);
    const other = await createUser();
    await order([{ productId: p.id, quantity: 1 }], other.cookie);
    expect((await review(2, other)).status).toBe(201);

    let row = await productRow(p.id);
    expect(row!.review_count).toBe(2);
    expect(Number(row!.rating_avg)).toBe(3.5);
    // The catalog serves the stored numbers.
    const listed = (await call(listProducts, "/api/products")).json.find((x: { id: string }) => x.id === p.id);
    expect(listed).toMatchObject({ rating: 3.5, reviewCount: 2 });

    await review(4, other); // an edit
    expect(Number((await productRow(p.id))!.rating_avg)).toBe(4.5);
    await query("DELETE FROM feedback WHERE buyer_id = $1", [other.id]);
    row = await productRow(p.id);
    expect(row!.review_count).toBe(1);
    expect(Number(row!.rating_avg)).toBe(5);
  });

  it("keep sold count and last-sold time current as orders come and go", async () => {
    const p = await createProduct(store.id, { quantity: 20 });
    expect((await productRow(p.id))!.last_sold_at).toBeNull();

    const placed = await order([{ productId: p.id, quantity: 3 }]);
    expect(placed.status).toBe(201);
    let row = await productRow(p.id);
    expect(row!.sold_count).toBe(3);
    expect(row!.last_sold_at).not.toBeNull();
    const listed = (await call(listProducts, "/api/products")).json.find((x: { id: string }) => x.id === p.id);
    expect(listed.soldCount).toBe(3);
    expect(listed.tags).toContain("trending"); // sold within the last 30 days
    expect(listed.lastSoldAt).toBeTruthy();

    await order([{ productId: p.id, quantity: 2 }]);
    expect((await productRow(p.id))!.sold_count).toBe(5);

    await query("DELETE FROM orders WHERE id = $1", [placed.json.id]);
    row = await productRow(p.id);
    expect(row!.sold_count).toBe(2);
    expect(row!.last_sold_at).not.toBeNull();
  });

  it("stop trending once the last sale is older than 30 days", async () => {
    const p = await createProduct(store.id);
    await order([{ productId: p.id, quantity: 1 }]);
    await query("UPDATE products SET last_sold_at = now() - interval '31 days' WHERE id = $1", [p.id]);
    const listed = (await call(listProducts, "/api/products")).json.find((x: { id: string }) => x.id === p.id);
    expect(listed.tags).not.toContain("trending");
  });
});

describe("audit log", () => {
  const latest = (action: string) => queryOne<{ actor_username: string; entity_type: string; entity_id: string | null; details: Record<string, unknown> }>(
    "SELECT actor_username, entity_type, entity_id, details FROM audit_log WHERE action = $1 ORDER BY id DESC LIMIT 1", [action]);

  it("records who changed a store's status, a buyer's status, a payment and a payout", async () => {
    const owner = await createUser();
    const pending = await insertStore(owner.id, "under_review");
    await call(setStoreStatus, `/api/admin/stores/${pending.id}`, { method: "PATCH", cookie: admin.cookie, body: { status: "active" } }, params({ id: pending.id }));
    expect(await latest("store.status_changed")).toMatchObject({ actor_username: admin.username, entity_type: "store", entity_id: pending.id, details: { status: "active" } });

    const target = await createUser();
    await call(setBuyerStatus, `/api/admin/buyers/${target.id}`, { method: "PATCH", cookie: admin.cookie, body: { status: "limited" } }, params({ id: target.id }));
    expect(await latest("buyer.status_changed")).toMatchObject({ entity_id: target.id, details: { status: "limited" } });

    const p = await createProduct(store.id, { price: 1000, freeDelivery: true });
    await order([{ productId: p.id, quantity: 1 }]);
    const tx = (await queryOne<{ id: string }>("SELECT st.id FROM seller_transactions st JOIN order_items oi ON oi.id = st.order_item_id WHERE oi.product_id = $1", [p.id]))!;
    await call(confirmTransaction, `/api/admin/transactions/${tx.id}`, { method: "PATCH", cookie: admin.cookie, body: { confirmed: true } }, params({ id: tx.id }));
    expect(await latest("payment.confirmed")).toMatchObject({ entity_type: "seller_transaction", entity_id: tx.id });

    const paid = await call(payout, "/api/admin/payouts", { method: "POST", cookie: admin.cookie, body: { storeId: store.id } });
    expect(paid.status).toBe(201);
    const entry = await latest("payout.created");
    expect(entry).toMatchObject({ entity_type: "store", entity_id: store.id });
    expect(entry!.details.amount).toBe(paid.json.amount);
  });

  it("keeps the entry after the admin's account is deleted, and is append-only", async () => {
    const doomed = await createUser({ role: "admin" });
    const victim = await createUser();
    await call(deleteUser, `/api/admin/users/${victim.id}`, { method: "DELETE", cookie: doomed.cookie }, params({ id: victim.id }));
    const entry = await latest("user.deleted");
    expect(entry).toMatchObject({ actor_username: doomed.username, entity_id: victim.id });

    await query("DELETE FROM users WHERE id = $1", [doomed.id]); // the actor goes away ...
    const kept = await queryOne<{ actor_id: string | null; actor_username: string }>("SELECT actor_id, actor_username FROM audit_log WHERE action = 'user.deleted' AND entity_id = $1", [victim.id]);
    expect(kept).toEqual({ actor_id: null, actor_username: doomed.username }); // ... the trail stays

    await expect(query("UPDATE audit_log SET action = 'tampered'")).rejects.toThrow(/append-only/);
    await expect(query("DELETE FROM audit_log")).rejects.toThrow(/append-only/);
  });
});

describe("encrypted bank details", () => {
  const bank = { name: "Seller One", accountNumber: "1234567890", bankName: "Demo Bank", branch: "Colombo", contactNumber: "0112345678" };
  const application = (b: object) => ({ businessName: "Crypto Shop", fullName: "Owner", address: "1 Road", telephone: "0112223334", email: "shop@example.com", aboutStore: "About us", bankDetails: bank, ...b });

  it("stores them encrypted (never as plaintext) and shows them only to the owner and admins", async () => {
    const owner = await createUser();
    const res = await call(createStore, "/api/stores", { method: "POST", cookie: owner.cookie, body: application({ bankDetailsOptional: { ...bank, accountNumber: "9999999999" } }) });
    expect(res.status).toBe(201);
    expect(res.json.store.bankDetails).toEqual(bank); // the owner gets it back decrypted

    const raw = await queryOne<{ bank_details: unknown; bank_details_optional: unknown; bank_details_enc: string; bank_details_optional_enc: string }>(
      "SELECT bank_details, bank_details_optional, bank_details_enc, bank_details_optional_enc FROM stores WHERE id = $1", [res.json.store.id]);
    expect(raw!.bank_details).toBeNull();
    expect(raw!.bank_details_optional).toBeNull();
    expect(isEncrypted(raw!.bank_details_enc)).toBe(true);
    expect(raw!.bank_details_enc).not.toContain("1234567890");
    expect(raw!.bank_details_optional_enc).not.toContain("9999999999");

    expect((await call(myStore, "/api/stores/mine", { cookie: owner.cookie })).json.store).toMatchObject({ bankDetails: bank, bankDetailsOptional: { accountNumber: "9999999999" } });
    const asAdmin = (await call(adminStores, "/api/admin/stores", { cookie: admin.cookie })).json.find((s: { id: string }) => s.id === res.json.store.id);
    expect(asAdmin.bankDetails).toEqual(bank);

    await call(setStoreStatus, `/api/admin/stores/${res.json.store.id}`, { method: "PATCH", cookie: admin.cookie, body: { status: "active" } }, params({ id: res.json.store.id }));
    const publicView = (await call(publicStores, "/api/stores")).json.find((s: { id: string }) => s.id === res.json.store.id);
    expect(publicView.bankDetails).toEqual({ name: "", accountNumber: "", bankName: "", branch: "", contactNumber: "" });
  });

  it("still reads a store saved in plaintext before encryption existed", async () => {
    const owner = await createUser();
    const legacy = await insertStore(owner.id); // the test helper writes the old plaintext column
    const asAdmin = (await call(adminStores, "/api/admin/stores", { cookie: admin.cookie })).json.find((s: { id: string }) => s.id === legacy.id);
    expect(asAdmin.bankDetails.accountNumber).toBeTruthy();
  });
});

describe("GET /api/products pagination", () => {
  it("returns the plain full list when no paging parameters are given", async () => {
    const res = await call(listProducts, "/api/products");
    expect(Array.isArray(res.json)).toBe(true);
  });

  it("pages a section with a total, newest first, without overlap", async () => {
    const own = await createUser();
    const shop = await insertStore(own.id);
    const made = [] as { id: string }[];
    for (let i = 0; i < 5; i++) made.push(await createProduct(shop.id));
    await query("UPDATE products SET tags = '{sale}' WHERE id = ANY($1::uuid[])", [made.map((p) => p.id)]);

    const first = await call(listProducts, "/api/products", { search: "?section=sale&limit=2&offset=0" });
    const second = await call(listProducts, "/api/products", { search: "?section=sale&limit=2&offset=2" });
    expect(first.json.items).toHaveLength(2);
    expect(first.json.total).toBeGreaterThanOrEqual(5);
    expect(second.json.total).toBe(first.json.total);
    const ids = [...first.json.items, ...second.json.items].map((p: { id: string }) => p.id);
    expect(new Set(ids).size).toBe(4);
    expect(first.json.items.every((p: { tags: string[] }) => p.tags.includes("sale"))).toBe(true);
  });

  it("orders 'deal' by most recent sale and only includes sold products", async () => {
    const res = await call(listProducts, "/api/products", { search: "?section=deal&limit=20" });
    const times = res.json.items.map((p: { lastSoldAt: string }) => new Date(p.lastSoldAt).getTime());
    expect(times.length).toBeGreaterThan(0);
    expect([...times].sort((a: number, b: number) => b - a)).toEqual(times);
  });

  it("fetches specific products by id and rejects bad input", async () => {
    const p = await createProduct(store.id);
    const byId = await call(listProducts, "/api/products", { search: `?ids=${p.id}&limit=5` });
    expect(byId.json.items.map((x: { id: string }) => x.id)).toEqual([p.id]);
    expect((await call(listProducts, "/api/products", { search: "?ids=not-a-uuid" })).status).toBe(400);
    expect((await call(listProducts, "/api/products", { search: "?section=bogus" })).status).toBe(400);
    expect((await call(listProducts, "/api/products", { search: "?storeId=nope&limit=3" })).status).toBe(400);
    const clamped = await call(listProducts, "/api/products", { search: "?limit=9999" });
    expect(clamped.json.items.length).toBeLessThanOrEqual(60);
  });

  it("filters by store", async () => {
    const own = await createUser();
    const shop = await insertStore(own.id);
    await createProduct(shop.id);
    const res = await call(listProducts, "/api/products", { search: `?storeId=${shop.id}&limit=10` });
    expect(res.json.total).toBe(1);
  });
});

describe("bank-details encryption helper", () => {
  const key = randomBytes(32);

  it("round-trips any JSON and uses a fresh IV every time", () => {
    const value = { name: "A", accountNumber: "123", nested: [1, 2, { ok: true }] };
    const a = encryptJson(value, key);
    const b = encryptJson(value, key);
    expect(a).not.toBe(b);
    expect(isEncrypted(a)).toBe(true);
    expect(a.startsWith("v1:")).toBe(true);
    expect(decryptJson(a, key)).toEqual(value);
  });

  it("refuses a wrong key, a tampered value and a plaintext string", () => {
    const stored = encryptJson({ secret: 1 }, key);
    expect(() => decryptJson(stored, randomBytes(32))).toThrow();
    const [v, iv, tag, data] = stored.split(":");
    const flipped = Buffer.from(data, "base64");
    flipped[0] ^= 1;
    expect(() => decryptJson([v, iv, tag, flipped.toString("base64")].join(":"), key)).toThrow();
    expect(() => decryptJson('{"name":"plain"}', key)).toThrow(/encrypted format/);
  });

  it("accepts a base64 or hex key and rejects one of the wrong length", () => {
    expect(bankKey({ BANK_DETAILS_KEY: key.toString("base64") })?.equals(key)).toBe(true);
    expect(bankKey({ BANK_DETAILS_KEY: key.toString("hex") })?.equals(key)).toBe(true);
    expect(bankKey({ BANK_DETAILS_KEY: "short" })).toBeNull();
    expect(bankKey({})).toBeNull();
    expect(() => encryptJson({ a: 1 }, null as unknown as Buffer)).toThrow(/BANK_DETAILS_KEY/);
  });
});

describe("database TLS setting", () => {
  it.each([
    ["scripts", sslFor],
    ["app", appSslFor],
  ])("%s: local databases skip TLS, remote ones encrypt, and DATABASE_SSL=verify checks the certificate", (_name, fn) => {
    const remote = "postgres://u:p@db.example.com/x";
    expect(fn("postgres://u:p@localhost/x", {})).toBe(false);
    expect(fn(remote, {})).toEqual({ rejectUnauthorized: false });
    expect(fn(remote, { DATABASE_SSL: "verify" })).toEqual({ rejectUnauthorized: true });
    expect(fn(remote, { DATABASE_SSL: " VERIFY ", DATABASE_CA_CERT: "-----BEGIN CERTIFICATE-----\\nabc\\n-----END CERTIFICATE-----" })).toEqual({
      rejectUnauthorized: true,
      ca: "-----BEGIN CERTIFICATE-----\nabc\n-----END CERTIFICATE-----",
    });
  });
});
