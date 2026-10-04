"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useBanners } from "@/context/BannersContext";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";

const AUTOPLAY_MS = 4000;

export function ImageBannerSlider() {
  const { banners, loading } = useBanners();
  const [index, setIndex] = useState(0);
  // Bumped whenever the user navigates manually, so the autoplay effect below restarts its
  // timer from zero instead of advancing again right away.
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % banners.length);
    }, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [tick, banners.length]);

  if (loading || banners.length === 0) return null;

  const safeIndex = index % banners.length;

  const goTo = (next: number) => {
    setIndex((next + banners.length) % banners.length);
    setTick((t) => t + 1);
  };

  return (
    <section className="relative mt-6 overflow-hidden rounded-2xl shadow-sm">
      <div
        className="flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${safeIndex * 100}%)` }}
      >
        {banners.map((banner) => (
          <div key={banner.id} className="relative h-56 w-full shrink-0 overflow-hidden sm:h-72 md:h-80">
            <PlaceholderImage
              seed={banner.id}
              image={banner.imageUrl}
              label={banner.title}
              className="absolute inset-0 h-full w-full"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 px-8 pb-8 text-white">
              {banner.title && <h2 className="text-2xl font-bold sm:text-3xl">{banner.title}</h2>}
              {banner.subtitle && <p className="mt-1 text-sm text-white/85 sm:text-base">{banner.subtitle}</p>}
            </div>
          </div>
        ))}
      </div>

      {banners.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous slide"
            onClick={() => goTo(safeIndex - 1)}
            className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-slate-700 shadow transition hover:bg-white"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            aria-label="Next slide"
            onClick={() => goTo(safeIndex + 1)}
            className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-slate-700 shadow transition hover:bg-white"
          >
            <ChevronRight size={18} />
          </button>

          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
            {banners.map((banner, i) => (
              <button
                key={banner.id}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => goTo(i)}
                className={`h-2 rounded-full transition-all ${
                  i === safeIndex ? "w-6 bg-white" : "w-2 bg-white/50 hover:bg-white/75"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
