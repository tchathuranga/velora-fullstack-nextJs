import { hashPassword, requireAdmin } from "@/server/auth";
import { query, queryOne } from "@/server/db";
import { conflict, isUniqueViolation, ok, parseBody, route } from "@/server/http";
import { createAdminSchema } from "@/server/validation";

interface UserRow {
  id: string;
  username: string;
  email: string;
  name: string;
  role: "buyer" | "admin";
  status: "active" | "limited";
  store_status: string | null;
  created_at: Date;
}

const toAdminUser = (r: UserRow) => ({
  id: r.id,
  username: r.username,
  email: r.email,
  name: r.name,
  // Same rule as the session: a buyer with an approved store counts as a seller.
  role: r.role === "admin" ? "admin" : r.store_status === "active" ? "seller" : "buyer",
  status: r.status,
  createdAt: r.created_at.toISOString(),
});

const SELECT_USERS = `SELECT u.id, u.username, u.email, u.name, u.role, u.status, s.status AS store_status, u.created_at
                        FROM users u LEFT JOIN stores s ON s.owner_id = u.id`;

/** Every account (admins, buyers and sellers). Filtering and search happen client-side. */
export const GET = route(async (req) => {
  await requireAdmin(req);
  const rows = await query<UserRow>(`${SELECT_USERS} ORDER BY u.created_at DESC`);
  return ok(rows.map(toAdminUser));
});

/** Create another admin account. */
export const POST = route(async (req) => {
  await requireAdmin(req);
  const { name, username, email, password } = await parseBody(req, createAdminSchema);

  try {
    const row = await queryOne<{ id: string }>(
      "INSERT INTO users (username, email, name, password_hash, role) VALUES ($1, $2, $3, $4, 'admin') RETURNING id",
      [username, email, name, await hashPassword(password)],
    );
    const created = await queryOne<UserRow>(`${SELECT_USERS} WHERE u.id = $1`, [row!.id]);
    return ok(toAdminUser(created!), { status: 201 });
  } catch (err) {
    if (isUniqueViolation(err, "users_username_key")) throw conflict("That username is already taken.");
    if (isUniqueViolation(err, "users_email_key")) throw conflict("An account with that email already exists.");
    throw err;
  }
});
