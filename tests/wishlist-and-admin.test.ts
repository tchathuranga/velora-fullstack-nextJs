import { describe, expect, it } from "vitest";
import { PATCH as setStoreStatus } from "@/app/api/admin/stores/[id]/route";
import { GET as getWishlist, POST as toggleWishlist, PUT as mergeWishlist } from "@/app/api/wishlist/route";
import { call, createProduct, createStore, createUser, params, queryOne } from "./helpers/api";

describe("/api/wishlist", () => {
  it("requires a signed-in non-admin account", async () => {
    expect((await call(getWishlist, "/api/wishlist")).status).toBe(401);
    const admin = await createUser({ role: "admin" });
    expect((await call(getWishlist, "/api/wishlist", { cookie: admin.cookie })).status).toBe(403);
  });

  it("toggles a product on and off", async () => {
    const owner = await createUser();
    const product = await createProduct((await createStore(owner.id)).id);
    const user = await createUser();

    const on = await call(toggleWishlist, "/api/wishlist", { method: "POST", body: { productId: product.id }, cookie: user.cookie });
    expect(on.json.productIds).toEqual([product.id]);

    const off = await call(toggleWishlist, "/api/wishlist", { method: "POST", body: { productId: product.id }, cookie: user.cookie });
    expect(off.json.productIds).toEqual([]);
  });

  it("ignores unknown products and merges a guest list without duplicates", async () => {
    const owner = await createUser();
    const store = await createStore(owner.id);
    const [a, b] = [await createProduct(store.id), await createProduct(store.id)];
    const user = await createUser();

    await call(toggleWishlist, "/api/wishlist", { method: "POST", body: { productId: a.id }, cookie: user.cookie });
    const ghost = "00000000-0000-4000-8000-000000000000";
    const merged = await call(mergeWishlist, "/api/wishlist", {
      method: "PUT",
      body: { productIds: [a.id, b.id, ghost] },
      cookie: user.cookie,
    });
    expect([...merged.json.productIds].sort()).toEqual([a.id, b.id].sort());
  });

  it("keeps each user's list private and removes entries when a product is deleted", async () => {
    const owner = await createUser();
    const product = await createProduct((await createStore(owner.id)).id);
    const [u1, u2] = [await createUser(), await createUser()];
    await call(toggleWishlist, "/api/wishlist", { method: "POST", body: { productId: product.id }, cookie: u1.cookie });

    expect((await call(getWishlist, "/api/wishlist", { cookie: u2.cookie })).json.productIds).toEqual([]);

    await queryOne("DELETE FROM products WHERE id = $1", [product.id]);
    expect((await call(getWishlist, "/api/wishlist", { cookie: u1.cookie })).json.productIds).toEqual([]);
  });
});

describe("PATCH /api/admin/stores/[id]", () => {
  it("lets an admin approve a store, which turns its owner into a seller", async () => {
    const owner = await createUser();
    const store = await createStore(owner.id, "under_review");
    const admin = await createUser({ role: "admin" });

    const res = await call(
      setStoreStatus,
      `/api/admin/stores/${store.id}`,
      { method: "PATCH", body: { status: "active" }, cookie: admin.cookie },
      params({ id: store.id }),
    );
    expect(res.status).toBe(200);
    expect(res.json.status).toBe("active");

    const { GET: me } = await import("@/app/api/auth/me/route");
    expect((await call(me, "/api/auth/me", { cookie: owner.cookie })).json.user.role).toBe("seller");
  });

  it("refuses non-admins, bad ids, bad statuses and unknown stores", async () => {
    const owner = await createUser();
    const store = await createStore(owner.id, "under_review");
    const admin = await createUser({ role: "admin" });
    const patch = (id: string, body: unknown, cookie?: string) =>
      call(setStoreStatus, `/api/admin/stores/${id}`, { method: "PATCH", body, cookie }, params({ id }));

    expect((await patch(store.id, { status: "active" })).status).toBe(401);
    expect((await patch(store.id, { status: "active" }, owner.cookie)).status).toBe(403);
    expect((await patch(store.id, { status: "banana" }, admin.cookie)).status).toBe(400);
    expect((await patch("not-a-uuid", { status: "active" }, admin.cookie)).status).toBe(404);
    expect((await patch("00000000-0000-4000-8000-000000000000", { status: "active" }, admin.cookie)).status).toBe(404);
    expect((await queryOne<{ status: string }>("SELECT status FROM stores WHERE id = $1", [store.id]))!.status).toBe("under_review");
  });
});
