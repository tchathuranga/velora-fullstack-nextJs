import { NextResponse } from "next/server";
import { hashPassword, loadSession, sessionPayload, setSessionCookie, signSession, verifyPassword } from "@/server/auth";
import { queryOne } from "@/server/db";
import { ApiError, parseBody, route } from "@/server/http";
import { z } from "zod";

const schema = z.object({ username: z.string().trim().min(1).max(100), password: z.string().min(1).max(200) });

let decoyHash: Promise<string> | undefined;

export const POST = route(async (req) => {
  const { username, password } = await parseBody(req, schema);

  const admin = await queryOne<{ id: string; password_hash: string }>(
    "SELECT id, password_hash FROM users WHERE role = 'admin' AND lower(username) = lower($1)",
    [username],
  );

  const valid = await verifyPassword(password, admin?.password_hash ?? (await (decoyHash ??= hashPassword("decoy-password"))));
  if (!admin || !valid) throw new ApiError(401, "Invalid admin credentials.");

  const res = NextResponse.json(sessionPayload(await loadSession(admin.id)));
  setSessionCookie(res, await signSession(admin.id));
  return res;
});
