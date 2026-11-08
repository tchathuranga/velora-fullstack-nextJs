import { createHash } from "node:crypto";
import { ApiError } from "./http";

interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

/** Trims whitespace and surrounding quotes, which are easy to paste into a host's env-var form by mistake. */
function cleanEnv(value: string | undefined): string | undefined {
  return value?.trim().replace(/^["']|["']$/g, "").trim();
}

export function cloudinaryConfig(): CloudinaryConfig {
  const rawSecret = process.env.CLOUDINARY_API_SECRET;
  const cloudName = cleanEnv(process.env.CLOUDINARY_CLOUD_NAME);
  const apiKey = cleanEnv(process.env.CLOUDINARY_API_KEY);
  const apiSecret = cleanEnv(rawSecret);
  if (!cloudName || !apiKey || !apiSecret) {
    throw new ApiError(503, "Image uploads aren't configured yet.");
  }
  // TEMP diagnostic: never logs the secret itself. Remove once uploads work on Render.
  console.log("[cloudinary] config check", {
    cloudName,
    apiKeyLength: apiKey.length,
    secretLength: apiSecret.length,
    rawSecretLength: rawSecret?.length,
    secretHadWhitespaceOrQuotes: rawSecret !== apiSecret,
  });
  return { cloudName, apiKey, apiSecret };
}

/** Signs a direct browser → Cloudinary upload so the API secret never leaves the server. */
export function signUpload(folder: string) {
  const { cloudName, apiKey, apiSecret } = cloudinaryConfig();
  const timestamp = Math.floor(Date.now() / 1000);
  // Params are signed alphabetically as `k=v&k=v`, with the secret appended.
  const signature = createHash("sha1").update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`).digest("hex");
  return { cloudName, apiKey, timestamp, signature, folder };
}

/** True only for images hosted in our own Cloudinary account, so clients can't store arbitrary URLs. */
export function isOwnCloudinaryUrl(value: string): boolean {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  return !!cloudName && value.startsWith(`https://res.cloudinary.com/${cloudName}/image/upload/`);
}
