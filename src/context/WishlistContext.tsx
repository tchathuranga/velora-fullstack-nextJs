"use client";

import { createContext, useContext, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/Redux/hooks";
import { hydrateWishlist, toggleWishlist as toggleWishlistAction } from "@/Redux/slices/wishlistSlice";

interface WishlistContextValue {
  productIds: string[];
  toggleWishlist: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;
}

const WishlistContext = createContext<WishlistContextValue | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const productIds = useAppSelector((state) => state.wishlist.productIds);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const stored = window.localStorage.getItem("velora_wishlist");
      if (stored) {
        dispatch(hydrateWishlist(JSON.parse(stored)));
      }
    } catch {
      // ignore
    }
  }, [dispatch]);

  const toggleWishlist = (productId: string) => {
    dispatch(toggleWishlistAction(productId));
  };

  const isWishlisted = (productId: string) => productIds.includes(productId);

  return (
    <WishlistContext.Provider value={{ productIds, toggleWishlist, isWishlisted }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
