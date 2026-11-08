"use client";

import Link from "next/link";
import {
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

// Solid colour first, so a tile is never left white-on-white if the gradient fails to apply.
const GRADIENTS = [
  ["#4f46e5", "#7c3aed"],
  ["#0284c7", "#0891b2"],
  ["#f97316", "#f43f5e"],
  ["#059669", "#0d9488"],
  ["#c026d3", "#db2777"],
  ["#f59e0b", "#ea580c"],
];

/** Picks an icon from words in the category name; anything unrecognised gets the generic grid icon. */
const ICON_RULES: [RegExp, LucideIcon][] = [
  [/electronic|phone|mobile|computer|laptop|gadget|tech/i, Smartphone],
  [/fashion|cloth|apparel|wear|shoe|bag/i, Shirt],
  [/home|living|furniture|kitchen|garden|decor/i, Home],
  [/beauty|health|cosmetic|care/i, Sparkles],
  [/sport|fitness|outdoor|gym/i, Dumbbell],
  [/toy|kid|baby/i, Baby],
  [/game|gaming/i, Gamepad2],
  [/jewel|watch|accessor/i, Gem],
  [/grocery|food|drink/i, ShoppingBasket],
  [/vehicle|car|auto|motor/i, Car],
  [/book|stationery|education/i, BookOpen],
  [/pet/i, PawPrint],
  [/tool|hardware|industrial/i, Wrench],
];

const iconFor = (name: string): LucideIcon => ICON_RULES.find(([re]) => re.test(name))?.[1] ?? LayoutGrid;

function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function CategoryShowcase() {
  const { categories, loading } = useCategories();

  if (loading || categories.length === 0) return null;

  return (
    <section className="py-6">
      <h2 className="mb-3 text-lg font-semibold text-slate-900">Shop by category</h2>
      {/* Phones: a swipeable row showing four tiles at a time. Larger screens: a wrapping grid. */}
      <div className="scrollbar-thin -mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-6">
        {categories.map((category) => {
          const Icon = iconFor(category.name);
          const [from, to] = GRADIENTS[hashSeed(category.id) % GRADIENTS.length];
          return (
            <Link
              key={category.id}
              href={`/category/${category.slug}`}
              style={{ backgroundColor: from, backgroundImage: `linear-gradient(135deg, ${from}, ${to})` }}
              className="flex aspect-square w-[calc((100%-1.5rem)/4)] shrink-0 snap-start flex-col items-center justify-center gap-1.5 overflow-hidden rounded-2xl p-2 text-center text-white shadow-sm transition hover:shadow-md sm:aspect-auto sm:min-h-28 sm:w-auto sm:gap-2 sm:p-4"
            >
              <Icon size={22} className="shrink-0 opacity-90" />
              <p className="line-clamp-2 text-[11px] font-semibold leading-tight sm:text-sm">{category.name}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
