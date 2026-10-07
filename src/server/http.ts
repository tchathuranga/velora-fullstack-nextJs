import { NextRequest, NextResponse } from "next/server";
import { ZodError, ZodType } from "zod";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export const badRequest = (message: string) => new ApiError(400, message);
export const unauthorized = (message = "Please log in to continue.") => new ApiError(401, message);
export const forbidden = (message = "You don't have access to this.") => new ApiError(403, message);
export const notFound = (message = "Not found.") => new ApiError(404, message);
export const conflict = (message: string) => new ApiError(409, message);

type Handler<C> = (req: NextRequest, ctx: C) => Promise<Response | NextResponse>;

/** Wraps a route handler so thrown ApiError / validation errors become JSON `{ error }` responses. */
export function route<C = unknown>(handler: Handler<C>): Handler<C> {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (err) {
      if (err instanceof ApiError) return NextResponse.json({ error: err.message }, { status: err.status });
      if (err instanceof ZodError) {
        const first = err.issues[0];
        const path = first?.path.join(".");
        const message = first?.message ?? "Invalid request.";
        return NextResponse.json({ error: path ? `${path}: ${message}` : message }, { status: 400 });
      }
      console.error("[api]", req.method, req.nextUrl.pathname, err);
      return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
    }
  };
}

export async function parseBody<T>(req: NextRequest, schema: ZodType<T>): Promise<T> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw badRequest("Request body must be valid JSON.");
  }
  return schema.parse(body);
}

export const ok = <T>(data: T, init?: ResponseInit) => NextResponse.json(data, init);

/** Postgres unique-violation (23505) on the named constraint/index. */
export function isUniqueViolation(err: unknown, constraint?: string): boolean {
  const e = err as { code?: string; constraint?: string };
  return e?.code === "23505" && (!constraint || e.constraint === constraint);
}

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (value: string) => UUID_RE.test(value);
