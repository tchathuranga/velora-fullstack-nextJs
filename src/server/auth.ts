import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";
import type { Address } from "@/types";
import type { AuthUser } from "@/types/auth";
import { queryOne } from "./db";
import { forbidden, unauthorized } from "./http";

export const SESSION_COOKIE = "won_session";
const SESSION_DAYS = 7;

function secret(): Uint8Array {
  const value = process.env.JWT_SECRET;
  if (!value || value.length < 32) throw new Error("JWT_SECRET must be set to a random string of at least 32 characters");
  return new TextEncoder().encode(value);
}

export const hashPassword = (password: string) => bcrypt.hash(password, 10);
export const verifyPassword = (password: string, hash: string) => bcrypt.compare(password, hash);

export async function signSession(userId: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secret());
}

export function setSessionCookie(res: NextResponse, token: string) {
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export function clearSessionCookie(res: NextResponse) {
  res.cookies.set(SESSION_COOKIE, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
}

export interface Session extends AuthUser {
  userId: string;
  /** Present only while the account's store is approved ("seller" role). */
  storeId: string | null;
}

interface SessionRow {
  id: string;
  username: string;
  email: string;
  name: string;
  role: "buyer" | "admin";
  status: "active" | "limited";
  store_id: string | null;
  store_slug: string | null;
  store_status: string | null;
  address: (Omit<Address, "email"> & { email: string | null }) | null;
}

/** Resolves the request's session cookie to a live account (role is derived from current DB state, not the token). */
export async function getSession(req: NextRequest): Promise<Session | null> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  let userId: string | undefined;
  try {
    userId = (await jwtVerify(token, secret())).payload.sub;
  } catch {
    return null;
  }
  if (!userId) return null;

  return loadSession(userId);
}

export async function loadSession(userId: string): Promise<Session | null> {
  const row = await queryOne<SessionRow>(
    `SELECT u.id, u.username, u.email, u.name, u.role, u.status,
            s.id AS store_id, s.slug AS store_slug, s.status AS store_status,
            CASE WHEN a.user_id IS NULL THEN NULL ELSE jsonb_build_object(
              'fullName', a.full_name, 'street', a.street, 'city', a.city, 'province', a.province,
              'phone1', a.phone1, 'phone2', a.phone2, 'zipCode', a.zip_code, 'email', a.email) END AS address
       FROM users u
       LEFT JOIN stores s ON s.owner_id = u.id
       LEFT JOIN user_addresses a ON a.user_id = u.id
      WHERE u.id = $1`,
    [userId],
  );
  if (!row || row.status === "limited") return null;

  const isSeller = row.role === "buyer" && row.store_status === "active";
  return {
    userId: row.id,
    role: row.role === "admin" ? "admin" : isSeller ? "seller" : "buyer",
    username: row.username,
    name: row.name,
    email: row.email,
    buyerId: row.role === "buyer" ? row.id : undefined,
    storeSlug: isSeller ? (row.store_slug ?? undefined) : undefined,
    storeId: isSeller ? row.store_id : null,
    sellerStoreSlug: row.store_slug ?? undefined,
    address: row.address ? { ...row.address, email: row.address.email ?? undefined } : undefined,
  };
}

export async function requireSession(req: NextRequest): Promise<Session> {
  const session = await getSession(req);
  if (!session) throw unauthorized();
  return session;
}

export async function requireAdmin(req: NextRequest): Promise<Session> {
  const session = await requireSession(req);
  if (session.role !== "admin") throw forbidden();
  return session;
}

/** Any signed-in non-admin account (buyers, and sellers who also shop). */
export async function requireBuyer(req: NextRequest): Promise<Session> {
  const session = await requireSession(req);
  if (session.role === "admin") throw forbidden("Admin accounts can't use buyer features.");
  return session;
}

export async function requireSeller(req: NextRequest): Promise<Session & { storeId: string }> {
  const session = await requireSession(req);
  if (session.role !== "seller" || !session.storeId) throw forbidden("Only approved sellers can do this.");
  return session as Session & { storeId: string };
}

export function sessionPayload(session: Session | null): { user: AuthUser | null } {
  if (!session) return { user: null };
  const { userId: _userId, storeId: _storeId, ...user } = session;
  void _userId;
  void _storeId;
  return { user };
}
