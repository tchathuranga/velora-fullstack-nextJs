"use client";

import { useState } from "react";
import { ImageDropzone } from "@/components/ui/ImageDropzone";
import { useAppDispatch, useAppSelector } from "@/Redux/hooks";
import { MAX_IMAGES, addImages, removeImage, replaceImage, swapImages } from "@/Redux/slices/productFormSlice";
import { uploadImage } from "@/lib/upload";

/**
 * The listing's photos (index 0 is the main image). A photo is uploaded the moment it is chosen and the form keeps
 * only its hosted URL, so photos survive moving between the listing form and the variation pages and are exactly what
 * gets saved with the listing.
 */
export function ProductPhotoGrid() {
  const dispatch = useAppDispatch();
  const images = useAppSelector((state) => state.productForm.images);
  const [pending, setPending] = useState(0);
  const [error, setError] = useState("");

  const upload = async (files: File[], replaceIndex?: number) => {
    setError("");
    setPending((n) => n + files.length);
    const results = await Promise.allSettled(files.map((file) => uploadImage(file, "product")));
    setPending((n) => n - files.length);

    const urls = results.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
    const failed = results.find((r): r is PromiseRejectedResult => r.status === "rejected");
    if (failed) setError(failed.reason instanceof Error ? failed.reason.message : "A photo couldn't be uploaded. Please try again.");
    if (urls.length === 0) return;

    if (replaceIndex !== undefined) {
      dispatch(replaceImage({ index: replaceIndex, url: urls[0] }));
      if (urls.length > 1) dispatch(addImages(urls.slice(1)));
    } else {
      dispatch(addImages(urls));
    }
  };

  const setSlot = (index: number, file: File | null) => {
    if (file) void upload([file], index);
    else dispatch(removeImage(index));
  };

  const handleGridDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (e.dataTransfer.types.includes("application/x-photo-index")) return;
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
    if (files.length) void upload(files);
  };

  // Empty slots right after the filled ones show a spinner while photos are uploading.
  const uploadingSlots = new Set(Array.from({ length: pending }, (_, i) => images.length + i));

  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-slate-700">Photos</p>
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="w-full sm:w-40">
          <ImageDropzone
            label="Main image"
            className="w-full"
            index={0}
            preview={images[0] ?? null}
            busy={uploadingSlots.has(0)}
            multiple
            onFileSelect={(file) => setSlot(0, file)}
            onFilesSelect={(files) => void upload(files)}
            onReorder={(from, to) => dispatch(swapImages({ from, to }))}
          />
        </div>
        <div
          className="grid flex-1 grid-cols-4 gap-2 sm:grid-cols-6"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleGridDrop}
        >
          {Array.from({ length: MAX_IMAGES - 1 }, (_, i) => {
            const index = i + 1;
            return (
              <ImageDropzone
                key={index}
                label={String(index)}
                index={index}
                preview={images[index] ?? null}
                busy={uploadingSlots.has(index)}
                multiple
                onFileSelect={(file) => setSlot(index, file)}
                onFilesSelect={(files) => void upload(files)}
                onReorder={(from, to) => dispatch(swapImages({ from, to }))}
              />
            );
          })}
        </div>
      </div>
      {error && <p className="mt-2 text-sm text-[var(--color-danger)]">{error}</p>}
      <p className="mt-2 text-xs text-[var(--color-muted)]">
        Tip: select or drag in multiple photos at once, and drag a photo onto another slot to swap their order.
      </p>
    </div>
  );
}
