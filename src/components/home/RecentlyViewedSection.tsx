"use client";

import { useGetProductsPageQuery } from "@/Redux/api";
import { useRecentlyViewed } from "@/context/RecentlyViewedContext";
import { ProductSection } from "./ProductSection";

/** The products this browser has looked at recently, fetched by id (not by loading the whole catalog). */
export function RecentlyViewedSection() {
  const { productIds } = useRecentlyViewed();
  const ids = productIds.slice(0, 12);
  const { data } = useGetProductsPageQuery({ ids, limit: 12 }, { skip: ids.length === 0 });
  const items = ids
    .map((id) => data?.items.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  if (items.length === 0) return null;

  return <ProductSection id="recently-viewed" title="Recently viewed" products={items} />;
}
