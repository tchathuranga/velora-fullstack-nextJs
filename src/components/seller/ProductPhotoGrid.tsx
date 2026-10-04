"use client";

import { useEffect, useState } from "react";
import { ImageDropzone } from "@/components/ui/ImageDropzone";

// Index 0 is the main/cover image; 1..12 are the gallery grid.
const TOTAL_SLOTS = 13;

interface SlotImage {
  file: File;
  preview: string;
}

interface ProductPhotoGridProps {
  /** Called whenever the filled photo slots change, with the uploaded files in slot order (main image first). */
  onPhotosChange?: (files: File[]) => void;
}

export function ProductPhotoGrid({ onPhotosChange }: ProductPhotoGridProps) {
  const [photos, setPhotos] = useState<(SlotImage | null)[]>(Array(TOTAL_SLOTS).fill(null));

  useEffect(() => {
    onPhotosChange?.(photos.filter((p): p is SlotImage => p !== null).map((p) => p.file));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos]);

  const fillEmptySlots = (files: File[]) => {
    setPhotos((prev) => {
      const next = [...prev];
      let fileIndex = 0;
      for (let i = 0; i < next.length && fileIndex < files.length; i++) {
        if (!next[i]) {
          next[i] = { file: files[fileIndex], preview: URL.createObjectURL(files[fileIndex]) };
          fileIndex++;
        }
      }
      return next;
    });
  };

  const setSlot = (index: number, file: File | null) => {
    setPhotos((prev) => {
      const next = [...prev];
      const existing = next[index];
      if (existing) URL.revokeObjectURL(existing.preview);
      next[index] = file ? { file, preview: URL.createObjectURL(file) } : null;
      return next;
    });
  };

  const reorder = (fromIndex: number, toIndex: number) => {
    setPhotos((prev) => {
      const next = [...prev];
      [next[fromIndex], next[toIndex]] = [next[toIndex], next[fromIndex]];
      return next;
    });
  };

  const handleGridDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (e.dataTransfer.types.includes("application/x-photo-index")) return;
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
    if (files.length) fillEmptySlots(files);
  };

  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-slate-700">Photos</p>
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="w-full sm:w-40">
          <ImageDropzone
            label="Main image"
            className="w-full"
            index={0}
            preview={photos[0]?.preview ?? null}
            multiple
            onFileSelect={(file) => setSlot(0, file)}
            onFilesSelect={fillEmptySlots}
            onReorder={reorder}
          />
        </div>
        <div
          className="grid flex-1 grid-cols-4 gap-2 sm:grid-cols-6"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleGridDrop}
        >
          {photos.slice(1).map((photo, i) => {
            const index = i + 1;
            return (
              <ImageDropzone
                key={index}
                label={String(index)}
                index={index}
                preview={photo?.preview ?? null}
                multiple
                onFileSelect={(file) => setSlot(index, file)}
                onFilesSelect={fillEmptySlots}
                onReorder={reorder}
              />
            );
          })}
        </div>
      </div>
      <p className="mt-2 text-xs text-[var(--color-muted)]">
        Tip: select or drag in multiple photos at once, and drag a photo onto another slot to swap their order.
      </p>
    </div>
  );
}
