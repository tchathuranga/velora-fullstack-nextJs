"use client";

import { createContext, useContext, useMemo } from "react";
import { skipToken } from "@reduxjs/toolkit/query";
import { useGetAdminStoresQuery, useGetMyStoreQuery, useGetStoresQuery, useSetStoreStatusMutation } from "@/Redux/api";
import { useAuth } from "@/context/AuthContext";
import type { SellerStatus, Store } from "@/types";

interface StoresContextValue {
  /**
   * Approved stores for everyone (without private contact / bank details); plus the signed-in
   * account's own store in any status, and every store (with full details) for admins.
   */
  stores: Store[];
  loading: boolean;
  /** Admin only. */
  updateStoreStatus: (storeId: string, status: SellerStatus) => Promise<void>;
}

const StoresContext = createContext<StoresContextValue | undefined>(undefined);

export function StoresProvider({ children }: { children: React.ReactNode }) {
  const { role, hydrated, sellerStoreSlug } = useAuth();
  const publicStores = useGetStoresQuery();
  const myStore = useGetMyStoreQuery(hydrated && sellerStoreSlug ? undefined : skipToken);
  const adminStores = useGetAdminStoresQuery(role === "admin" ? undefined : skipToken);
  const [setStatus] = useSetStoreStatusMutation();

  const stores = useMemo(() => {
    // Later entries win, so private (owner / admin) versions replace the public ones with the same id.
    const byId = new Map<string, Store>();
    for (const store of [...(publicStores.data ?? []), ...(myStore.data ? [myStore.data] : []), ...(adminStores.data ?? [])]) {
      byId.set(store.id, store);
    }
    return [...byId.values()];
  }, [publicStores.data, myStore.data, adminStores.data]);

  const loading =
    publicStores.isLoading || !hydrated || (Boolean(sellerStoreSlug) && myStore.isLoading) || (role === "admin" && adminStores.isLoading);

  const value = useMemo<StoresContextValue>(
    () => ({
      stores,
      loading,
      updateStoreStatus: async (storeId, status) => {
        await setStatus({ id: storeId, status }).unwrap();
      },
    }),
    [stores, loading, setStatus],
  );

  return <StoresContext.Provider value={value}>{children}</StoresContext.Provider>;
}

export function useStores() {
  const ctx = useContext(StoresContext);
  if (!ctx) throw new Error("useStores must be used within StoresProvider");
  return ctx;
}
