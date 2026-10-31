import { requireSeller, requireSession } from "@/server/auth";
import { signUpload } from "@/server/cloudinary";
import { ok, parseBody, route } from "@/server/http";
import { uploadSignSchema } from "@/server/validation";

/** Returns a short-lived signature for uploading one image to the caller's own Cloudinary folder. */
export const POST = route(async (req) => {
  const { kind } = await parseBody(req, uploadSignSchema);

  if (kind === "product") {
    const session = await requireSeller(req);
    return ok(signUpload(`velora/stores/${session.storeId}/${kind}`));
  }

  // Store photos are also uploaded while registering a store, before it has been approved, so they use the caller's own folder
  // (as do profile pictures and message photos).
  const session = await requireSession(req);
  return ok(signUpload(`velora/users/${session.userId}/${kind}`));
});
