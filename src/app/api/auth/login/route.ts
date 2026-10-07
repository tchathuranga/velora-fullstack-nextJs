import { NextResponse } from "next/server";
import { hashPassword, loadSession, sessionPayload, setSessionCookie, signSession, verifyPassword } from "@/server/auth";
import { queryOne } from "@/server/db";
import { ApiError, forbidden, parseBody, route } from "@/server/http";
import { loginSchema } from "@/server/validation";

// Compared against when no account matches, so response time doesn't reveal whether a username exists.
let decoyHash: Promise<string> | undefined;

export const POST = route(async (req) => {
  const { identifier, password } = await parseBody(req, loginSchema);

  const user = await queryOne<{ id: string; password_hash: string; status: string }>(
    "SELECT id, password_hash, status FROM users WHERE role = 'buyer' AND (lower(username) = lower($1) OR lower(email) = lower($1))",
    [identifier],
  );

  const valid = await verifyPassword(password, user?.password_hash ?? (await (decoyHash ??= hashPassword("decoy-password"))));
  if (!user || !valid) throw new ApiError(401, "Invalid username or password. Please check your credentials and try again.");
  if (user.status === "limited") throw forbidden("Your account has been limited. Please contact support.");

  const res = NextResponse.json(sessionPayload(await loadSession(user.id)));
  setSessionCookie(res, await signSession(user.id));
  return res;
});
