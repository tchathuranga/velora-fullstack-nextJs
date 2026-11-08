// How scripts connect to Postgres over TLS. Keep in sync with src/server/db-ssl.ts (the app's copy of the same rule).
//
//   (default)            encrypted, certificate not checked - how the app has always connected
//   DATABASE_SSL=verify  encrypted AND the server certificate is verified
//                        (set DATABASE_CA_CERT to the provider's CA certificate in PEM if it is not publicly trusted)
/**
 * @param {string} url
 * @param {Record<string, string | undefined>} [env]
 */
export function sslFor(url, env = process.env) {
  if (/localhost|127\.0\.0\.1/.test(url)) return false;
  if ((env.DATABASE_SSL ?? "").trim().toLowerCase() === "verify") {
    const ca = env.DATABASE_CA_CERT?.replace(/\\n/g, "\n").trim();
    return ca ? { rejectUnauthorized: true, ca } : { rejectUnauthorized: true };
  }
  return { rejectUnauthorized: false };
}
