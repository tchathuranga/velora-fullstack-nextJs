import { Loader2 } from "lucide-react";

export function PageLoader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center py-16">
      <Loader2 size={28} className="animate-spin text-[var(--color-muted)]" />
    </div>
  );
}
