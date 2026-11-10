"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Baby,
  Car,
  Dumbbell,
  Gamepad2,
  Gem,
  Home,
  LayoutGrid,
  Shirt,
  ShoppingBasket,
  Smartphone,
  Sparkles,
  BookOpen,
  PawPrint,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { useCategories } from "@/context/CategoriesContext";

interface CategoryTheme {
  icon: LucideIcon;
  /** Solid colour behind the tile: shown when the category has no uploaded photo, and while one loads. */
  base: string;
}

/** Picks a theme from words in the category name; anything unrecognised gets the generic one. */
const THEME_RULES: [RegExp, CategoryTheme][] = [
  [/electronic|phone|mobile|computer|laptop|gadget|tech/i, { icon: Smartphone, base: "#4f46e5" }],
  [/fashion|cloth|apparel|wear|shoe|bag/i, { icon: Shirt, base: "#c026d3" }],
  [/home|living|furniture|kitchen|garden|decor/i, { icon: Home, base: "#059669" }],
  [/beauty|health|cosmetic|care/i, { icon: Sparkles, base: "#ec4899" }],
  [/sport|fitness|outdoor|gym/i, { icon: Dumbbell, base: "#f97316" }],
  [/toy|kid|baby/i, { icon: Baby, base: "#f59e0b" }],
  [/game|gaming/i, { icon: Gamepad2, base: "#7c3aed" }],
  [/jewel|watch|accessor/i, { icon: Gem, base: "#0f766e" }],
  [/grocery|food|drink/i, { icon: ShoppingBasket, base: "#16a34a" }],
  [/vehicle|car|auto|motor/i, { icon: Car, base: "#1e40af" }],
  [/book|stationery|education/i, { icon: BookOpen, base: "#b45309" }],
  [/pet/i, { icon: PawPrint, base: "#ea580c" }],
  [/tool|hardware|industrial/i, { icon: Wrench, base: "#475569" }],
];

const DEFAULT_THEME: CategoryTheme = { icon: LayoutGrid, base: "#4338ca" };

const themeFor = (name: string): CategoryTheme => THEME_RULES.find(([re]) => re.test(name))?.[1] ?? DEFAULT_THEME;

const PER_SLIDE = 4;
const AUTOPLAY_MS = 4000;

type Category = ReturnType<typeof useCategories>["categories"][number];

function CategoryTile({ category, className = "" }: { category: Category; className?: string }) {
  const { icon: Icon, base } = themeFor(category.name);
  const photo = category.imageUrl;
  return (
    <Link
      href={`/category/${category.slug}`}
      style={{ backgroundColor: base }}
      className={`group relative isolate flex flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl p-4 text-center text-white shadow-sm transition duration-300 active:scale-95 hover:-translate-y-0.5 hover:shadow-lg ${className}`}
    >
      {/* Photo on its own layer so it can zoom on hover without moving the label. */}
      {photo && (
        <span
          aria-hidden
          style={{ backgroundImage: `url(${photo})` }}
          className="pointer-events-none absolute inset-0 -z-10 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
        />
      )}
      {/* Dark wash keeps the white label readable on any photo; it lifts a little on hover. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-t from-slate-950/80 via-slate-950/45 to-slate-950/25 transition-opacity duration-300 group-hover:opacity-80"
      />
      <span className="relative flex size-10 items-center justify-center rounded-full bg-white/20 ring-1 ring-white/30 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
        <Icon size={20} className="shrink-0" />
      </span>
      <p className="relative line-clamp-2 text-sm font-semibold leading-tight drop-shadow-sm">{category.name}</p>
    </Link>
  );
}

/** Phone-only slider: swipeable slides of 4 tiles (2x2), with dots and a counter. */
function CategorySlider({ categories }: { categories: Category[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const slides: Category[][] = [];
  for (let i = 0; i < categories.length; i += PER_SLIDE) {
    slides.push(categories.slice(i, i + PER_SLIDE));
  }

  const handleScroll = () => {
    const el = trackRef.current;
    if (!el || el.clientWidth === 0) return;
    setActive(Math.round(el.scrollLeft / el.clientWidth));
  };

  const goTo = (index: number) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollTo({ left: index * el.clientWidth, behavior: "smooth" });
  };

  // Auto-advance; the timer restarts whenever the slide changes (including manual swipes),
  // loops back to the first slide, and holds while the user is touching the slider.
  const slideCount = slides.length;
  useEffect(() => {
    if (slideCount < 2 || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setTimeout(() => goTo((active + 1) % slideCount), AUTOPLAY_MS);
    return () => window.clearTimeout(timer);
  }, [active, slideCount, paused]);

  return (
    <div className="sm:hidden">
      <div
        ref={trackRef}
        onScroll={handleScroll}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setPaused(false)}
        onTouchCancel={() => setPaused(false)}
        className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((slide, index) => (
          <div key={index} className="grid w-full shrink-0 snap-center grid-cols-2 gap-3 px-0.5 py-1">
            {slide.map((category) => (
              <CategoryTile key={category.id} category={category} className="h-28" />
            ))}
          </div>
        ))}
      </div>

      {slides.length > 1 && (
        <div className="mt-3 flex items-center justify-center gap-3">
          <button
            type="button"
            aria-label="Previous categories"
            disabled={active === 0}
            onClick={() => goTo(active - 1)}
            className="rounded-full p-1 text-slate-500 transition disabled:opacity-30"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="flex items-center gap-1.5">
            {slides.map((_, index) => (
              <button
                key={index}
                type="button"
                aria-label={`Go to slide ${index + 1}`}
                aria-current={index === active}
                onClick={() => goTo(index)}
                className={`h-2 rounded-full transition-all ${
                  index === active ? "w-6 bg-indigo-600" : "w-2 bg-slate-300"
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            aria-label="Next categories"
            disabled={active === slides.length - 1}
            onClick={() => goTo(active + 1)}
            className="rounded-full p-1 text-slate-500 transition disabled:opacity-30"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}

export function CategoryShowcase() {
  const { categories, loading } = useCategories();

  if (loading || categories.length === 0) return null;

  return (
    <section className="py-6">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Shop by category</h2>
      </div>

      {/* Phones: swipeable slider, 4 categories per slide. */}
      <CategorySlider categories={categories} />

      {/* Larger screens: a wider grid. */}
      <div className="hidden gap-4 sm:grid sm:grid-cols-3 lg:grid-cols-6">
        {categories.map((category) => (
          <CategoryTile key={category.id} category={category} className="min-h-28" />
        ))}
      </div>
    </section>
  );
}
