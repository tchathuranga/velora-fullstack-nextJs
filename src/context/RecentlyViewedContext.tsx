"use client";

import { createContext, useContext, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { addViewed as addViewedAction, hydrateRecentlyViewed } from "@/store/recentlyViewedSlice";

interface RecentlyViewedContextValue {
  productIds: string[];
  addViewed: (productId: string) => void;
}

const RecentlyViewedContext = createContext<RecentlyViewedContextValue | undefined>(undefined);

export function RecentlyViewedProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const productIds = useAppSelector((state) => state.recentlyViewed.productIds);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const stored = window.localStorage.getItem("velora_recently_viewed");
      if (stored) {
        dispatch(hydrateRecentlyViewed(JSON.parse(stored)));
      }
    } catch {
      // ignore
    }
  }, [dispatch]);

  const addViewed = (productId: string) => {
    dispatch(addViewedAction(productId));
  };

  return <RecentlyViewedContext.Provider value={{ productIds, addViewed }}>{children}</RecentlyViewedContext.Provider>;
}

export function useRecentlyViewed() {
  const ctx = useContext(RecentlyViewedContext);
  if (!ctx) throw new Error("useRecentlyViewed must be used within RecentlyViewedProvider");
  return ctx;
}
