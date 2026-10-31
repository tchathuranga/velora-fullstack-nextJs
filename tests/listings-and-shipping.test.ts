import { beforeAll, describe, expect, it } from "vitest";
import { GET as listConversations, POST as startConversation } from "@/app/api/conversations/route";
import { POST as sendMessage } from "@/app/api/conversations/[id]/messages/route";
import { GET as listNotifications, POST as markNotificationsRead } from "@/app/api/notifications/route";
import { PATCH as shipItem } from "@/app/api/orders/[id]/items/[itemId]/route";
import { POST as placeOrder } from "@/app/api/orders/route";
import { GET as getProduct, PATCH as editProduct } from "@/app/api/products/[slug]/route";
import { PUT as setStatus } from "@/app/api/products/[slug]/status/route";
import { GET as listProducts, POST as createListing } from "@/app/api/products/route";
import { GET as getStore } from "@/app/api/stores/[slug]/route";
import { addDays, todayInColombo } from "@/lib/shipping";
import { billing, call, createProduct, createStore, createUser, params, query, queryOne } from "./helpers/api";

let seller: Awaited<ReturnType<typeof createUser>>;
let buyer: Awaited<ReturnType<typeof createUser>>;
let store: { id: string; slug: string };

beforeAll(async () => {
  process.env.CLOUDINARY_CLOUD_NAME = "demo";
  seller = await createUser();
  buyer = await createUser();
  store = await createStore(seller.id);
});

const order = (body: unknown, cookie = buyer.cookie) => call(placeOrder, "/api/orders", { method: "POST", body, cookie });
const stockOf = async (id: string) => (await queryOne<{ quantity: number }>("SELECT quantity FROM products WHERE id = $1", [id]))!.quantity;

const listing = {
  title: "Phone",
  categoryId: null,
  subcategoryId: null,
  price: 1000,
  quantity: 5,
  brand: "Acme",
  condition: "New",
  customSpecs: [],
  description: "<p>Nice</p>",
  handlingTime: "2-3 days",
  deliveryTime: "3-5 days",
  freeDelivery: false,
  deliveryFee: 500,
  extraDeliveryFee: 150,
  returnsAccepted: true,
  paymentMethods: ["cod"],
  location: "Colombo",
  images: [],
  variations: null,
};

describe("shipping per listing", () => {
  it("charges the first item's fee plus the additional-item fee for each further unit", async () => {
    const p = await createProduct(store.id, { price: 100, quantity: 10, deliveryFee: 500, extraDeliveryFee: 150 });
    const res = await order({ items: [{ productId: p.id, quantity: 3 }], paymentMethod: "cod", billing });
    expect(res.status).toBe(201);
    expect(res.json).toMatchObject({ subtotal: 300, deliveryCost: 800, total: 1100 });
    expect(res.json.items[0].shippingCost).toBe(800);

    // The seller's payment line covers the item price plus the shipping.
    const txn = await queryOne<{ amount: number }>("SELECT amount FROM seller_transactions WHERE order_item_id = $1", [res.json.items[0].id]);
    expect(txn!.amount).toBe(1100);
  });

  it("charges nothing for free shipping", async () => {
    const p = await createProduct(store.id, { freeDelivery: true, deliveryFee: 0, extraDeliveryFee: 150 });
    const res = await order({ items: [{ productId: p.id, quantity: 4 }], paymentMethod: "cod", billing });
    expect(res.json.deliveryCost).toBe(0);
  });
});

describe("variations", () => {
  const variations = () => ({
    attributes: [{ name: "Color", options: ["Red", "Blue"] }],
    images: {},
    combinations: [
      { id: "var-red", values: { Color: "Red" }, quantity: 3, price: 900 },
      { id: "var-blue", values: { Color: "Blue" }, quantity: 0, price: 1100 },
    ],
  });

  it("prices and stocks the chosen variation, records it, and keeps the listing total in step", async () => {
    const p = await createProduct(store.id, { price: 900, quantity: 3, variations: variations(), deliveryFee: 300, extraDeliveryFee: 100 });
    const res = await order({ items: [{ productId: p.id, variationId: "var-red", quantity: 2 }], paymentMethod: "cod", billing });
    expect(res.status).toBe(201);
    expect(res.json).toMatchObject({ subtotal: 1800, deliveryCost: 400 });
    expect(res.json.items[0]).toMatchObject({ variation: { Color: "Red" }, variationId: "var-red", price: 900 });

    const row = await queryOne<{ quantity: number; variations: { combinations: { id: string; quantity: number }[] } }>(
      "SELECT quantity, variations FROM products WHERE id = $1",
      [p.id],
    );
    expect(row!.quantity).toBe(1);
    expect(row!.variations.combinations.find((c) => c.id === "var-red")!.quantity).toBe(1);
  });

  it("requires a variation choice and rejects sold-out or unknown variations", async () => {
    const p = await createProduct(store.id, { quantity: 3, variations: variations() });
    expect((await order({ items: [{ productId: p.id, quantity: 1 }], paymentMethod: "cod", billing })).status).toBe(400);
    const soldOut = await order({ items: [{ productId: p.id, variationId: "var-blue", quantity: 1 }], paymentMethod: "cod", billing });
    expect(soldOut.status).toBe(409);
    expect(soldOut.json.error).toMatch(/out of stock/);
    expect((await order({ items: [{ productId: p.id, variationId: "nope", quantity: 1 }], paymentMethod: "cod", billing })).status).toBe(409);
    expect(await stockOf(p.id)).toBe(3);
  });

  it("keeps separate lines for different variations of one listing and charges its shipping once", async () => {
    const v = variations();
    v.combinations[1].quantity = 5;
    const p = await createProduct(store.id, { quantity: 8, variations: v, deliveryFee: 500, extraDeliveryFee: 150 });
    const res = await order({
      items: [
        { productId: p.id, variationId: "var-red", quantity: 1 },
        { productId: p.id, variationId: "var-blue", quantity: 2 },
      ],
      paymentMethod: "cod",
      billing,
    });
    expect(res.status).toBe(201);
    expect(res.json.items).toHaveLength(2);
    expect(res.json.deliveryCost).toBe(800);
    expect(await stockOf(p.id)).toBe(5);
  });
});

describe("ship-by deadline and new-order notification", () => {
  it("sets the deadline from the seller's maximum handling time", async () => {
    const p = await createProduct(store.id, { handlingTime: "2-3 days" });
    const res = await order({ items: [{ productId: p.id, quantity: 1 }], paymentMethod: "cod", billing });
    expect(res.json.items[0].shipBy).toBe(addDays(todayInColombo(), 3));
  });

  it("notifies the seller with the order id", async () => {
    const p = await createProduct(store.id);
    const placed = await order({ items: [{ productId: p.id, quantity: 1 }], paymentMethod: "cod", billing });
    const bell = await call(listNotifications, "/api/notifications", { cookie: seller.cookie });
    expect(bell.status).toBe(200);
    expect(bell.json.notifications.some((n: { title: string; type: string }) => n.type === "order" && n.title.includes(placed.json.id))).toBe(true);
    expect(bell.json.unreadCount).toBeGreaterThan(0);
  });
});

describe("shipping details", () => {
  it("needs both courier and tracking number, shows them to the buyer and tells the buyer", async () => {
    const p = await createProduct(store.id);
    const placed = await order({ items: [{ productId: p.id, quantity: 1 }], paymentMethod: "cod", billing });
    const itemId = placed.json.items[0].id;
    const ctx = () => params({ id: placed.json.id, itemId });
    const path = `/api/orders/${placed.json.id}/items/${itemId}`;

    const partial = await call(shipItem, path, { method: "PATCH", cookie: seller.cookie, body: { trackingNumber: "IND123456" } }, ctx());
    expect(partial.status).toBe(400);

    const other = await createUser();
    await createStore(other.id);
    const foreign = await call(
      shipItem,
      path,
      { method: "PATCH", cookie: other.cookie, body: { trackingNumber: "X1", courierName: "Farder" } },
      ctx(),
    );
    expect(foreign.status).toBe(404);

    const done = await call(
      shipItem,
      path,
      { method: "PATCH", cookie: seller.cookie, body: { trackingNumber: "IND123456", courierName: "Farder" } },
      ctx(),
    );
    expect(done.status).toBe(200);

    const row = await queryOne<{ tracking_number: string; courier_name: string }>(
      "SELECT tracking_number, courier_name FROM order_items WHERE id = $1",
      [itemId],
    );
    expect(row).toEqual({ tracking_number: "IND123456", courier_name: "Farder" });
    expect((await queryOne<{ status: string }>("SELECT status FROM orders WHERE id = $1", [placed.json.id]))!.status).toBe("shipped");

    const bell = await call(listNotifications, "/api/notifications", { cookie: buyer.cookie });
    expect(bell.json.notifications.some((n: { title: string }) => n.title.includes(placed.json.id))).toBe(true);
  });
});

describe("listing lifecycle", () => {
  it("requires brand, condition and the return policy to list a product", async () => {
    const post = (body: unknown) => call(createListing, "/api/products", { method: "POST", cookie: seller.cookie, body });
    expect((await post({ ...listing, brand: "" })).status).toBe(400);
    expect((await post({ ...listing, condition: "" })).status).toBe(400);
    expect((await post({ ...listing, returnsAccepted: false })).status).toBe(400);
    expect((await post({ ...listing, handlingTime: "soon" })).status).toBe(400);

    const created = await post({ ...listing, condition: "Refurbished" });
    expect(created.status).toBe(201);
    expect(created.json).toMatchObject({ condition: "Refurbished", brand: "Acme", extraDeliveryFee: 150, returnsAccepted: true, status: "active" });
  });

  it("keeps an out-of-stock listing active and lets the seller restock it by editing", async () => {
    const created = await call(createListing, "/api/products", { method: "POST", cookie: seller.cookie, body: { ...listing, quantity: 0 } });
    const slug = created.json.slug;

    const publicList = await call(listProducts, "/api/products");
    expect(publicList.json.find((p: { slug: string }) => p.slug === slug)).toMatchObject({ quantity: 0, status: "active" });

    const edited = await call(
      editProduct,
      `/api/products/${slug}`,
      { method: "PATCH", cookie: seller.cookie, body: { ...listing, quantity: 7, title: "Phone v2" } },
      params({ slug }),
    );
    expect(edited.status).toBe(200);
    expect(edited.json).toMatchObject({ quantity: 7, title: "Phone v2" });
  });

  it("only lets the owner edit, and derives stock and price from variations", async () => {
    const created = await call(createListing, "/api/products", { method: "POST", cookie: seller.cookie, body: listing });
    const slug = created.json.slug;
    const stranger = await createUser();
    await createStore(stranger.id);
    const denied = await call(editProduct, `/api/products/${slug}`, { method: "PATCH", cookie: stranger.cookie, body: listing }, params({ slug }));
    expect(denied.status).toBe(403);

    const withVariations = {
      ...listing,
      variations: {
        attributes: [{ name: "Size", options: ["S", "L"] }],
        images: {},
        combinations: [
          { id: "v-s", values: { Size: "S" }, quantity: 2, price: 800 },
          { id: "v-l", values: { Size: "L" }, quantity: 3, price: 1200 },
        ],
      },
    };
    const res = await call(editProduct, `/api/products/${slug}`, { method: "PATCH", cookie: seller.cookie, body: withVariations }, params({ slug }));
    expect(res.json).toMatchObject({ quantity: 5, price: 800 });
    expect(res.json.variations.combinations).toHaveLength(2);
  });

  it("ends a listing into Unsold, hides it from buyers, and relists it", async () => {
    const created = await call(createListing, "/api/products", { method: "POST", cookie: seller.cookie, body: listing });
    const { slug, id } = created.json;
    const stats = async () => (await call(getStore, `/api/stores/${store.slug}`, {}, params({ slug: store.slug }))).json.stats;
    const before = await stats();

    const ended = await call(setStatus, `/api/products/${slug}/status`, { method: "PUT", cookie: seller.cookie, body: { status: "ended" } }, params({ slug }));
    expect(ended.json.status).toBe("ended");

    const after = await stats();
    expect(after.unsoldListings).toBe(before.unsoldListings + 1);
    expect(after.activeListings).toBe(before.activeListings - 1);

    expect((await call(listProducts, "/api/products")).json.some((p: { slug: string }) => p.slug === slug)).toBe(false);
    expect((await call(getProduct, `/api/products/${slug}`, {}, params({ slug }))).status).toBe(404);
    const own = await call(getProduct, `/api/products/${slug}`, { cookie: seller.cookie }, params({ slug }));
    expect(own.status).toBe(200);
    expect(own.json.status).toBe("ended");

    const blocked = await order({ items: [{ productId: id, quantity: 1 }], paymentMethod: "cod", billing });
    expect(blocked.status).toBe(409);

    const relisted = await call(setStatus, `/api/products/${slug}/status`, { method: "PUT", cookie: seller.cookie, body: { status: "active" } }, params({ slug }));
    expect(relisted.json.status).toBe("active");
    expect((await order({ items: [{ productId: id, quantity: 1 }], paymentMethod: "cod", billing })).status).toBe(201);
  });

  it("reports total units sold", async () => {
    const p = await createProduct(store.id, { quantity: 10 });
    await order({ items: [{ productId: p.id, quantity: 2 }], paymentMethod: "cod", billing });
    await order({ items: [{ productId: p.id, quantity: 3 }], paymentMethod: "cod", billing });
    const res = await call(getProduct, `/api/products/${p.slug}`, {}, params({ slug: p.slug }));
    expect(res.json.soldCount).toBe(5);
  });
});

describe("messages and notifications", () => {
  const photo = "https://res.cloudinary.com/demo/image/upload/v1/sample.jpg";

  it("shows buyers by username, carries photos and listing context, and notifies the other party", async () => {
    const p = await createProduct(store.id);
    const started = await call(startConversation, "/api/conversations", { method: "POST", cookie: buyer.cookie, body: { storeId: store.id } });
    expect(started.status).toBe(201);
    expect(started.json.buyerName).toBe(buyer.username);
    const conversationId = started.json.id;
    const ctx = () => params({ id: conversationId });
    const post = (cookie: string, body: unknown) =>
      call(sendMessage, `/api/conversations/${conversationId}/messages`, { method: "POST", cookie, body }, ctx());

    expect((await post(buyer.cookie, { text: "" })).status).toBe(400);
    expect((await post(buyer.cookie, { images: ["https://evil.example/x.png"] })).status).toBe(400);

    const sent = await post(buyer.cookie, { text: "Is this available?", images: [photo], productId: p.id });
    expect(sent.status).toBe(201);
    expect(sent.json.images).toEqual([photo]);

    const sellerBell = await call(listNotifications, "/api/notifications", { cookie: seller.cookie });
    expect(sellerBell.json.notifications.some((n: { type: string; title: string }) => n.type === "message" && n.title.includes(buyer.username))).toBe(true);

    expect((await post(seller.cookie, { text: "Yes, in stock" })).status).toBe(201);
    const buyerBell = await call(listNotifications, "/api/notifications", { cookie: buyer.cookie });
    expect(buyerBell.json.notifications.some((n: { type: string; title: string }) => n.type === "message" && n.title.includes("Shop"))).toBe(true);

    const mine = await call(listConversations, "/api/conversations", { cookie: buyer.cookie });
    const messages = mine.json.find((c: { id: string }) => c.id === conversationId).messages;
    expect(messages[0]).toMatchObject({ text: "Is this available?", images: [photo], product: { id: p.id } });
    expect(messages[1]).toMatchObject({ sender: "seller", images: [] });

    // Another buyer can't read or write in it.
    const nosy = await createUser();
    expect((await post(nosy.cookie, { text: "hi" })).status).toBe(403);
  });

  it("marks notifications as read", async () => {
    const user = await createUser();
    await query("INSERT INTO notifications (user_id, type, title) VALUES ($1, 'order', 'a'), ($1, 'order', 'b')", [user.id]);
    const before = await call(listNotifications, "/api/notifications", { cookie: user.cookie });
    expect(before.json.unreadCount).toBe(2);

    await call(markNotificationsRead, "/api/notifications", { method: "POST", cookie: user.cookie, body: { ids: [before.json.notifications[0].id] } });
    expect((await call(listNotifications, "/api/notifications", { cookie: user.cookie })).json.unreadCount).toBe(1);

    await call(markNotificationsRead, "/api/notifications", { method: "POST", cookie: user.cookie, body: {} });
    expect((await call(listNotifications, "/api/notifications", { cookie: user.cookie })).json.unreadCount).toBe(0);
    expect((await call(listNotifications, "/api/notifications")).status).toBe(401);
  });
});
