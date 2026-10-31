import { fileToDataUrl } from "@/lib/image";

export type UploadKind = "avatar" | "cover" | "store-avatar" | "store-cover" | "product" | "message";

/** Longest side, in px, each kind of image is downscaled to before upload. */
const MAX_DIMENSION: Record<UploadKind, number> = {
  avatar: 600,
  "store-avatar": 600,
  cover: 1600,
  "store-cover": 1600,
  product: 1400,
  message: 1400,
};

/** Downscales the file, then uploads it straight to Cloudinary with a server-issued signature. Returns the hosted URL. */
export async function uploadImage(file: File, kind: UploadKind): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file.");

  const signRes = await fetch("/api/uploads/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind }),
  });
  const sign = await signRes.json().catch(() => ({}));
  if (!signRes.ok) throw new Error(sign.error ?? "Couldn't start the upload. Please try again.");

  const form = new FormData();
  form.set("file", await fileToDataUrl(file, MAX_DIMENSION[kind]));
  form.set("api_key", sign.apiKey);
  form.set("timestamp", String(sign.timestamp));
  form.set("signature", sign.signature);
  form.set("folder", sign.folder);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`, { method: "POST", body: form });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.secure_url) throw new Error(body.error?.message ?? "The image couldn't be uploaded.");
  return body.secure_url as string;
}
