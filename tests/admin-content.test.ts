import { describe, expect, it } from "vitest";
import { POST as addCategory } from "@/app/api/admin/categories/route";
import { POST as addBanner } from "@/app/api/admin/banners/route";
import { call, createUser } from "./helpers/api";

describe("admin content creation", () => {
  it("lets an admin add a category", async () => {
    const admin = await createUser({ role: "admin" });
    const res = await call(addCategory, "/api/admin/categories", { method: "POST", body: { name: `Cat ${Date.now()}` }, cookie: admin.cookie });
    expect(res.status, JSON.stringify(res.json)).toBe(201);
  });
  it("lets an admin add a banner", async () => {
    const admin = await createUser({ role: "admin" });
    const res = await call(addBanner, "/api/admin/banners", { method: "POST", body: { title: "Hello" }, cookie: admin.cookie });
    expect(res.status, JSON.stringify(res.json)).toBe(201);
  });
});
