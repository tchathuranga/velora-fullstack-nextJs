import { createHash } from "node:crypto";
import { bankKey, decryptJson, encryptJson, isEncrypted } from "../../scripts/lib/bank-crypto.mjs";
import { ApiError } from "./http";

export { isEncrypted };

let warned = false;

/**
 * The bank-details key. In production it must be configured, otherwise storing bank details fails with a clear message
 * instead of silently saving them unprotected. Outside production a fixed development key is used so local work needs no setup.
 */
function key() {
  const configured = bankKey();
  if (configured) return configured;
  if (process.env.NODE_ENV === "production") {
    throw new ApiError(503, "Bank details can't be stored securely yet: BANK_DETAILS_KEY is not configured on the server.");
  }
  if (!warned) {
    warned = true;
    console.warn("[crypto] BANK_DETAILS_KEY is not set - using an insecure development key.");
  }
  return createHash("sha256").update("velora-development-only-key").digest();
}

export const encryptBankDetails = (value: unknown): string => encryptJson(value, key()) as string;
export const decryptBankDetails = <T>(stored: string): T => decryptJson(stored, key()) as T;
