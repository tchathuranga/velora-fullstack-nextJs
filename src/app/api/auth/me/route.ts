import { getSession, sessionPayload } from "@/server/auth";
import { ok, route } from "@/server/http";

export const GET = route(async (req) => ok(sessionPayload(await getSession(req))));
