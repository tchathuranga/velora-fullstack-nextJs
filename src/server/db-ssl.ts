import type { ConnectionOptions } from "node:tls";

/**
 * How the app connects to Postgres over TLS (scripts/lib/pg-ssl.mjs is the scripts' copy of the same rule).
 *
 *   (default)            encrypted, certificate not checked - how the app has always connected
 *   DATABASE_SSL=verify  encrypted AND the server certificate is verified
 *                        (set DATABASE_CA_CERT to the provider's CA certificate in PEM if it is not publicly trusted)
 */
export function sslFor(url: string, env: Record<string, string | undefined> = process.env): false | ConnectionOptions {
  if (/localhost|127\.0\.0\.1/.test(url)) return false;
  if ((env.DATABASE_SSL ?? "").trim().toLowerCase() === "verify") {
    const ca = env.DATABASE_CA_CERT?.replace(/\\n/g, "\n").trim();
    return ca ? { rejectUnauthorized: true, ca } : { rejectUnauthorized: true };
  }
  return { rejectUnauthorized: false };
}
