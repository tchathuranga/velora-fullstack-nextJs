"use client";

import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import clsx from "clsx";
import { uploadImage, UploadKind } from "@/lib/upload";
import { getErrorMessage } from "@/Redux/api";

/** A small camera button: pick a file → upload to Cloudinary → hand the hosted URL to `onUploaded` (which saves it). */
export function ImageUploadButton({
  kind,
  label,
  onUploaded,
  className,
  onError,
}: {
  kind: UploadKind;
  label: string;
  onUploaded: (url: string) => Promise<unknown>;
  className?: string;
  onError?: (message: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handle = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    onError?.("");
    try {
      await onUploaded(await uploadImage(file, kind));
    } catch (err) {
      onError?.(err instanceof Error && !("status" in err) ? err.message : getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        aria-label={label}
        title={label}
        className={clsx(
          "flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow hover:bg-white disabled:opacity-70",
          className,
        )}
      >
        {busy ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          handle(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </>
  );
}
