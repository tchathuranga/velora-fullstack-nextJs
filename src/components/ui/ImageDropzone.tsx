"use client";

import { useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import clsx from "clsx";

const REORDER_MIME = "application/x-photo-index";

interface ImageDropzoneProps {
  label?: string;
  className?: string;
  onFileSelect?: (file: File | null) => void;
  /** Called instead of onFileSelect when the user picks/drops more than one file. */
  onFilesSelect?: (files: File[]) => void;
  /** Allow selecting or dropping multiple files at once. */
  multiple?: boolean;
  /** Controlled preview URL. When provided, this component no longer tracks its own preview state. */
  preview?: string | null;
  /** This slot's position among a set of related dropzones. Enables drag-to-reorder when set. */
  index?: number;
  /** Called when an image from another slot (identified by index) is dragged onto this one. */
  onReorder?: (fromIndex: number, toIndex: number) => void;
}

export function ImageDropzone({
  label = "Add a image",
  className,
  onFileSelect,
  onFilesSelect,
  multiple,
  preview: controlledPreview,
  index,
  onReorder,
}: ImageDropzoneProps) {
  const [internalPreview, setInternalPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isControlled = controlledPreview !== undefined;
  const preview = isControlled ? controlledPreview : internalPreview;

  const handleFiles = (files: FileList | File[] | null) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);
    if (fileArray.length > 1 && onFilesSelect) {
      onFilesSelect(fileArray);
      return;
    }
    const file = fileArray[0];
    if (!isControlled) setInternalPreview(URL.createObjectURL(file));
    onFileSelect?.(file);
  };

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isControlled) setInternalPreview(null);
    onFileSelect?.(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const canReorder = index !== undefined && !!onReorder;

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      draggable={canReorder && !!preview}
      onDragStart={(e) => {
        if (!canReorder || !preview) return;
        e.dataTransfer.setData(REORDER_MIME, String(index));
        e.dataTransfer.effectAllowed = "move";
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        if (canReorder && e.dataTransfer.types.includes(REORDER_MIME)) {
          const fromIndex = Number(e.dataTransfer.getData(REORDER_MIME));
          if (!Number.isNaN(fromIndex) && fromIndex !== index) onReorder?.(fromIndex, index as number);
          return;
        }
        handleFiles(Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/")));
      }}
      className={clsx(
        "relative flex aspect-square w-full flex-col items-center justify-center gap-1.5 overflow-hidden rounded-lg border-2 border-dashed border-[var(--color-border)] bg-slate-50 text-[var(--color-muted)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]",
        canReorder && preview && "cursor-grab active:cursor-grabbing",
        className,
      )}
    >
      {preview ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Uploaded preview" draggable={false} className="h-full w-full object-cover" />
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
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </button>
  );
}
