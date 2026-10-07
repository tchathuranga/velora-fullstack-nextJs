import { NextRequest } from "next/server";
import { SESSION_COOKIE, hashPassword, signSession } from "@/server/auth";
import { query, queryOne } from "@/server/db";

export interface Call {
  method?: string;
  body?: unknown;
  cookie?: string;
  search?: string;
}

export function makeRequest(path: string, { method = "GET", body, cookie, search = "" }: Call = {}) {
  return new NextRequest(`http://localhost${path}${search}`, {
    method,
    headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

/** Invokes a route handler directly and returns status + parsed JSON + any cookie it set. */
export async function call<C = unknown>(
  handler: (req: NextRequest, ctx: C) => Promise<Response>,
  path: string,
  opts: Call = {},
  ctx: unknown = {},
) {
  const res = await handler(makeRequest(path, opts), ctx as C);
  const json = await res.json().catch(() => null);
  return { status: res.status, json, setCookie: res.headers.get("set-cookie") };
}

export const params = (p: Record<string, string>) => ({ params: Promise.resolve(p) });

export const sessionCookie = async (userId: string) => `${SESSION_COOKIE}=${await signSession(userId)}`;

let counter = 0;
const uniq = () => `${Date.now().toString(36)}${(counter += 1)}`;

export async function createUser(o: { role?: "buyer" | "admin"; status?: "active" | "limited"; password?: string } = {}) {
  const n = uniq();
  const password = o.password ?? "secret123";
  const user = await queryOne<{ id: string; username: string; email: string }>(
    `INSERT INTO users (username, email, name, password_hash, role, status) VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, username, email`,
    [`user_${n}`, `user_${n}@example.com`, `Test User ${n}`, await hashPassword(password), o.role ?? "buyer", o.status ?? "active"],
  );
  return { ...user!, password, cookie: await sessionCookie(user!.id) };
}

const bank = { name: "A", accountNumber: "1", bankName: "B", branch: "C", contactNumber: "2" };

export async function createStore(ownerId: string, status: "active" | "under_review" = "active") {
  const n = uniq();
  const store = await queryOne<{ id: string; slug: string }>(
    `INSERT INTO stores (slug, owner_id, store_name, business_name, full_name, address, telephone, email, status, bank_details)
     VALUES ($1, $2, 'Shop', 'Shop Ltd', 'Owner', 'Addr', '0112223334', 'shop@example.com', $3, $4) RETURNING id, slug`,
    [`shop-${n}`, ownerId, status, JSON.stringify(bank)],
  );
  return store!;
}

export async function createProduct(
  storeId: string,
  o: { price?: number; quantity?: number; deliveryFee?: number; freeDelivery?: boolean; paymentMethods?: string[] } = {},
) {
  const n = uniq();
  const product = await queryOne<{ id: string; slug: string }>(
    `INSERT INTO products (slug, store_id, title, price, quantity, delivery_fee, free_delivery, payment_methods)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, slug`,
    [
      `prod-${n}`,
      storeId,
      `Product ${n}`,
      o.price ?? 1000,
      o.quantity ?? 10,
      o.deliveryFee ?? 200,
      o.freeDelivery ?? false,
      o.paymentMethods ?? ["cod", "bank_transfer"],
    ],
  );
  return product!;
}

export const billing = {
  fullName: "Jane Buyer",
  street: "1 Main St",
  city: "Colombo",
  province: "Western",
  phone1: "0771234567",
  zipCode: "10000",
};

export { query, queryOne };
