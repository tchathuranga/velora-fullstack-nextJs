import { ImageDropzone } from "@/components/ui/ImageDropzone";

export function ProductPhotoGrid() {
  const slots = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-slate-700">Photos</p>
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="w-full sm:w-40">
          <ImageDropzone label="Main image" className="w-full" />
        </div>
        <div className="grid flex-1 grid-cols-4 gap-2 sm:grid-cols-6">
          {slots.map((n) => (
            <ImageDropzone key={n} label={String(n)} />
          ))}
        </div>
      </div>
    </div>
  );
}
