import { createHash } from "node:crypto";
import { ApiError } from "./http";

interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

export function cloudinaryConfig(): CloudinaryConfig {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    throw new ApiError(503, "Image uploads aren't configured yet.");
  }
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
