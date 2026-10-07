"use client";

import { createContext, useCallback, useContext, useEffect, useMemo } from "react";
import { skipToken } from "@reduxjs/toolkit/query";
import { useGetWishlistQuery, useMergeWishlistMutation, useToggleWishlistItemMutation } from "@/Redux/api";
import { useAuth } from "@/context/AuthContext";
import { useAppDispatch, useAppSelector } from "@/Redux/hooks";
import { hydrateWishlist, toggleWishlist as toggleLocalWishlist } from "@/Redux/slices/wishlistSlice";

interface WishlistContextValue {
  productIds: string[];
  toggleWishlist: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;
}

const WishlistContext = createContext<WishlistContextValue | undefined>(undefined);
const EMPTY: string[] = [];

/**
 * Signed-in accounts keep their wishlist in the database; guests keep it in this browser, and it is
 * merged into the account the next time they log in.
 */
export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const { role } = useAuth();
  const loggedIn = role === "buyer" || role === "seller";
  const localIds = useAppSelector((state) => state.wishlist.productIds);
  const server = useGetWishlistQuery(loggedIn ? undefined : skipToken);
  const [toggleServer] = useToggleWishlistItemMutation();
  const [mergeServer] = useMergeWishlistMutation();

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem("velora_wishlist");
      if (stored) dispatch(hydrateWishlist(JSON.parse(stored)));
    } catch {
      // ignore
    }
  }, [dispatch]);

  useEffect(() => {
    if (!loggedIn || localIds.length === 0) return;
    mergeServer(localIds)
      .unwrap()
      .then(() => dispatch(hydrateWishlist([])))
      .catch(() => {});
  }, [loggedIn, localIds, mergeServer, dispatch]);

  const productIds = loggedIn ? (server.data ?? EMPTY) : localIds;

  const toggleWishlist = useCallback(
    (productId: string) => {
      if (loggedIn) toggleServer(productId);
      else dispatch(toggleLocalWishlist(productId));
    },
    [loggedIn, toggleServer, dispatch],
  );

  const value = useMemo<WishlistContextValue>(
    () => ({ productIds, toggleWishlist, isWishlisted: (productId) => productIds.includes(productId) }),
    [productIds, toggleWishlist],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
