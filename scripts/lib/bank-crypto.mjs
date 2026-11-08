// AES-256-GCM encryption for sellers' bank details. One implementation, used by the server (src/server/crypto.ts) and by
// `npm run db:bank-details`. Stored form: "v1:<iv>:<auth tag>:<ciphertext>" (each part base64).
//
// The key comes from BANK_DETAILS_KEY: 32 random bytes as base64 or 64 hex characters. Generate one with
//   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
// Keep it out of the database and out of git (Render: Environment). Losing it makes the stored details unreadable.
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const PREFIX = "v1:";

/**
 * The key as 32 bytes, or null when BANK_DETAILS_KEY is unset or malformed.
 * @param {Record<string, string | undefined>} [env]
 * @returns {Buffer | null}
 */
export function bankKey(env = process.env) {
  const raw = (env.BANK_DETAILS_KEY ?? "").trim();
  if (!raw) return null;
  const key = /^[0-9a-f]{64}$/i.test(raw) ? Buffer.from(raw, "hex") : Buffer.from(raw, "base64");
  return key.length === 32 ? key : null;
}

export const isEncrypted = (value) => typeof value === "string" && value.startsWith(PREFIX);

/**
 * Encrypts any JSON-serialisable value. Throws if there is no usable key.
 * @param {unknown} value
 * @param {Buffer | null} [key]
 * @returns {string}
 */
export function encryptJson(value, key = bankKey()) {
  if (!key) throw new Error("BANK_DETAILS_KEY is not set (or is not 32 bytes).");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const data = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  return `${PREFIX}${iv.toString("base64")}:${cipher.getAuthTag().toString("base64")}:${data.toString("base64")}`;
}

/**
 * Reverses encryptJson. Throws on a wrong key or tampered data (GCM authenticates the ciphertext).
 * @param {string} stored
 * @param {Buffer | null} [key]
 * @returns {any}
 */
export function decryptJson(stored, key = bankKey()) {
  if (!key) throw new Error("BANK_DETAILS_KEY is not set (or is not 32 bytes).");
  if (!isEncrypted(stored)) throw new Error("Value is not in the encrypted format.");
  const [iv, tag, data] = stored.slice(PREFIX.length).split(":").map((part) => Buffer.from(part, "base64"));
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return JSON.parse(Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8"));
}
