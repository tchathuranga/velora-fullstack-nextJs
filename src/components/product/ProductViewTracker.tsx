"use client";

import { useEffect } from "react";
import { useRecentlyViewed } from "@/context/RecentlyViewedContext";

export function ProductViewTracker({ productId }: { productId: string }) {
  const { addViewed } = useRecentlyViewed();

  useEffect(() => {
    addViewed(productId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  return null;
}
