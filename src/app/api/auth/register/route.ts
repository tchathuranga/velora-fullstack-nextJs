import { NextResponse } from "next/server";
import { loadSession, hashPassword, sessionPayload, setSessionCookie, signSession } from "@/server/auth";
import { queryOne } from "@/server/db";
import { conflict, isUniqueViolation, parseBody, route } from "@/server/http";
import { registerSchema } from "@/server/validation";

export const POST = route(async (req) => {
  const { name, username, email, password } = await parseBody(req, registerSchema);

  let userId: string;
  try {
    const row = await queryOne<{ id: string }>(
      "INSERT INTO users (username, email, name, password_hash) VALUES ($1, $2, $3, $4) RETURNING id",
      [username, email, name, await hashPassword(password)],
    );
    userId = row!.id;
  } catch (err) {
    if (isUniqueViolation(err, "users_username_key")) throw conflict("That username is already taken.");
    if (isUniqueViolation(err, "users_email_key")) throw conflict("An account with that email already exists.");
    throw err;
  }

  const res = NextResponse.json(sessionPayload(await loadSession(userId)), { status: 201 });
  setSessionCookie(res, await signSession(userId));
  return res;
});
