"use client";

import { Banner } from "@/types";
import { ImageDropzone } from "@/components/ui/ImageDropzone";
import { EditableName } from "@/components/admin/EditableName";
import { fileToDataUrl } from "@/lib/image";

export function BannerDetailsPanel({
  banner,
  onUpdate,
  onUpdateImage,
  onDelete,
}: {
  banner: Banner;
  onUpdate: (fields: { title?: string; subtitle?: string }) => void;
  onUpdateImage: (imageUrl: string | undefined) => void;
  onDelete: () => void;
}) {
  return (
    <div className="p-6">
      <EditableName
        value={banner.title}
        allowEmpty
        placeholder="No title"
        onSave={(title) => onUpdate({ title })}
        onDelete={onDelete}
        deleteLabel="Delete banner"
      />

      <div className="mt-6 grid gap-6 sm:grid-cols-[10rem_1fr]">
        <div>
          <span className="mb-1.5 block text-sm font-medium text-slate-700">Image</span>
          <ImageDropzone
            label="Upload banner image"
            preview={banner.imageUrl ?? null}
            onFileSelect={async (file) => {
              if (!file) {
                onUpdateImage(undefined);
                return;
              }
              const dataUrl = await fileToDataUrl(file, 1600);
              onUpdateImage(dataUrl);
            }}
          />
        </div>

        <div className="space-y-4">
          <div>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Subtitle</span>
            <EditableName size="sm" allowEmpty placeholder="No subtitle" value={banner.subtitle} onSave={(subtitle) => onUpdate({ subtitle })} />
          </div>
        </div>
      </div>
    </div>
  );
}
