"use client";

import { useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import clsx from "clsx";

interface ImageDropzoneProps {
  label?: string;
  className?: string;
  onFileSelect?: (file: File | null) => void;
}

export function ImageDropzone({ label = "Add a image", className, onFileSelect }: ImageDropzoneProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File | null) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    onFileSelect?.(file);
  };

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    onFileSelect?.(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      className={clsx(
        "relative flex aspect-square w-full flex-col items-center justify-center gap-1.5 overflow-hidden rounded-lg border-2 border-dashed border-[var(--color-border)] bg-slate-50 text-[var(--color-muted)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]",
        className,
      )}
    >
      {preview ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Uploaded preview" className="h-full w-full object-cover" />
          <span
            role="button"
            onClick={clear}
            aria-label="Remove image"
            className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-slate-500 shadow hover:text-[var(--color-danger)]"
          >
            <X size={14} />
          </span>
        </>
      ) : (
        <>
          <Upload size={18} />
          <span className="px-1 text-center text-[11px] leading-tight">{label}</span>
        </>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />
    </button>
  );
}
