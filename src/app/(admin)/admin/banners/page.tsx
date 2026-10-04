"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useBanners } from "@/context/BannersContext";
import { BannerList } from "@/components/admin/BannerList";
import { BannerDetailsPanel } from "@/components/admin/BannerDetailsPanel";
import { Button } from "@/components/ui/Button";
import { PageLoader } from "@/components/ui/PageLoader";

export default function AdminBannersPage() {
  const { banners, loading, addBanner, updateBanner, updateBannerImage, deleteBanner, moveBanner } = useBanners();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [newBannerTitle, setNewBannerTitle] = useState("");

  if (loading) return <PageLoader />;

  const activeBanner = banners.find((b) => b.id === activeId) ?? banners[0] ?? null;

  return (
    <div className="container-page py-8">
      <h1 className="text-2xl font-bold text-slate-900">Homepage banners</h1>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        Manage the image slider shown at the top of the homepage, above the quick-link banners.
      </p>

      <div className="card mt-6 grid grid-cols-1 sm:grid-cols-[18rem_1fr]">
        <div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const trimmed = newBannerTitle.trim();
              if (!trimmed) return;
              addBanner(trimmed);
              setNewBannerTitle("");
            }}
            className="flex gap-2 border-b border-[var(--color-border)] p-3"
          >
            <input
              value={newBannerTitle}
              onChange={(e) => setNewBannerTitle(e.target.value)}
              placeholder="New banner title"
              className="input-base flex-1"
            />
            <Button type="submit" size="sm">
              <Plus size={14} />
              Add
            </Button>
          </form>
          <BannerList banners={banners} activeId={activeBanner?.id ?? null} onSelect={setActiveId} onMove={moveBanner} />
        </div>

        {activeBanner ? (
          <div className="border-t border-[var(--color-border)] sm:border-l sm:border-t-0">
            <BannerDetailsPanel
              banner={activeBanner}
              onUpdate={(fields) => updateBanner(activeBanner.id, fields)}
              onUpdateImage={(imageUrl) => updateBannerImage(activeBanner.id, imageUrl)}
              onDelete={() => {
                deleteBanner(activeBanner.id);
                setActiveId(null);
              }}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center border-t border-[var(--color-border)] p-10 text-sm text-[var(--color-muted)] sm:border-l sm:border-t-0">
            Add a banner to get started.
          </div>
        )}
      </div>
    </div>
  );
}
