import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/server/auth";
import { route } from "@/server/http";

export const POST = route(async () => {
  const res = NextResponse.json({ ok: true });
  clearSessionCookie(res);
  return res;
});
