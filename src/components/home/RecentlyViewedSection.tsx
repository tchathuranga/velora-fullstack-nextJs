"use client";

import { Product } from "@/types";
import { useRecentlyViewed } from "@/context/RecentlyViewedContext";
import { ProductSection } from "./ProductSection";

export function RecentlyViewedSection({ products }: { products: Product[] }) {
  const { productIds } = useRecentlyViewed();
  const items = productIds
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  if (items.length === 0) return null;

  return <ProductSection id="recently-viewed" title="Recently viewed" products={items} />;
}
