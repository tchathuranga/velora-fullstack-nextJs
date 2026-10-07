import { describe, expect, it } from "vitest";
import { GET as me } from "@/app/api/auth/me/route";
import { POST as login } from "@/app/api/auth/login/route";
import { POST as register } from "@/app/api/auth/register/route";
import { call, createUser, queryOne } from "./helpers/api";

const valid = { name: "Alice Smith", username: "alice_s", email: "Alice@Example.com", password: "secret123" };

describe("POST /api/auth/register", () => {
  it("creates a buyer, stores a hashed password and sets a session cookie", async () => {
    const res = await call(register, "/api/auth/register", { method: "POST", body: valid });
    expect(res.status).toBe(201);
    expect(res.json.user).toMatchObject({ username: "alice_s", email: "alice@example.com", role: "buyer" });
    expect(res.setCookie).toContain("won_session=");

    const row = await queryOne<{ password_hash: string; role: string }>(
      "SELECT password_hash, role FROM users WHERE username = 'alice_s'",
    );
    expect(row?.role).toBe("buyer");
    expect(row?.password_hash).not.toBe(valid.password);
  });

  it("rejects a duplicate username and a duplicate email (case-insensitive)", async () => {
    const dupUser = await call(register, "/api/auth/register", {
      method: "POST",
      body: { ...valid, username: "ALICE_S", email: "other@example.com" },
    });
    expect(dupUser.status).toBe(409);
    expect(dupUser.json.error).toMatch(/username/i);

    const dupEmail = await call(register, "/api/auth/register", { method: "POST", body: { ...valid, username: "alice_two" } });
    expect(dupEmail.status).toBe(409);
    expect(dupEmail.json.error).toMatch(/email/i);
  });

  it("validates input", async () => {
    const short = await call(register, "/api/auth/register", {
      method: "POST",
      body: { ...valid, username: "bob2", email: "b@x.com", password: "123" },
    });
    expect(short.status).toBe(400);

    const badEmail = await call(register, "/api/auth/register", { method: "POST", body: { ...valid, username: "bob3", email: "nope" } });
    expect(badEmail.status).toBe(400);
  });
});

describe("POST /api/auth/login", () => {
  it("logs in by username or by email", async () => {
    const u = await createUser({ password: "hunter22" });
    const byName = await call(login, "/api/auth/login", { method: "POST", body: { identifier: u.username, password: "hunter22" } });
    expect(byName.status).toBe(200);
    expect(byName.setCookie).toContain("won_session=");

    const byEmail = await call(login, "/api/auth/login", {
      method: "POST",
      body: { identifier: u.email.toUpperCase(), password: "hunter22" },
    });
    expect(byEmail.status).toBe(200);
  });

  it("rejects a wrong password and an unknown user with the same message", async () => {
    const u = await createUser();
    const wrong = await call(login, "/api/auth/login", { method: "POST", body: { identifier: u.username, password: "wrong-pass" } });
    const unknown = await call(login, "/api/auth/login", { method: "POST", body: { identifier: "nobody_here", password: "wrong-pass" } });
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrong.json.error).toBe(unknown.json.error);
  });

  it("blocks limited accounts and keeps admins out of the buyer login", async () => {
    const limited = await createUser({ status: "limited" });
    const res = await call(login, "/api/auth/login", { method: "POST", body: { identifier: limited.username, password: limited.password } });
    expect(res.status).toBe(403);

    const admin = await createUser({ role: "admin" });
    const adminRes = await call(login, "/api/auth/login", { method: "POST", body: { identifier: admin.username, password: admin.password } });
    expect(adminRes.status).toBe(401);
  });
});

describe("GET /api/auth/me", () => {
  it("returns the user for a valid session and null without one", async () => {
    const u = await createUser();
    const withSession = await call(me, "/api/auth/me", { cookie: u.cookie });
    expect(withSession.json.user).toMatchObject({ username: u.username, role: "buyer" });

    const anonymous = await call(me, "/api/auth/me");
    expect(anonymous.json.user).toBeNull();
  });

  it("ignores a tampered token and a limited account's valid token", async () => {
    const tampered = await call(me, "/api/auth/me", { cookie: "won_session=not.a.jwt" });
    expect(tampered.json.user).toBeNull();

    const limited = await createUser({ status: "limited" });
    const res = await call(me, "/api/auth/me", { cookie: limited.cookie });
    expect(res.json.user).toBeNull();
  });
});
