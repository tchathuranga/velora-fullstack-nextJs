"use client";

import Link from "next/link";
import { LayoutGrid } from "lucide-react";
import { useCategories } from "@/context/CategoriesContext";

const GRADIENTS = [
  "from-indigo-600 to-violet-600",
  "from-sky-600 to-cyan-600",
  "from-orange-500 to-rose-500",
  "from-emerald-600 to-teal-600",
  "from-fuchsia-600 to-pink-600",
  "from-amber-500 to-orange-600",
];

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
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/category/${category.slug}`}
            className={`relative flex min-h-28 flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-br p-4 text-center text-white shadow-sm transition hover:shadow-md ${
              GRADIENTS[hashSeed(category.id) % GRADIENTS.length]
            }`}
          >
            <LayoutGrid size={22} className="opacity-90" />
            <p className="text-sm font-semibold">{category.name}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
