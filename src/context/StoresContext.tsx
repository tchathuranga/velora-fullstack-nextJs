"use client";

import { createContext, useContext, useEffect, useRef } from "react";
import { SellerStatus, Store } from "@/types";
import { fetchJson } from "@/lib/fetchJson";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { addStore as addStoreAction, setStores, updateStoreStatus as updateStoreStatusAction } from "@/store/storesSlice";

const STORAGE_KEY = "velora_stores";

interface StoresContextValue {
  stores: Store[];
  loading: boolean;
  addStore: (store: Store) => void;
  updateStoreStatus: (storeId: string, status: SellerStatus) => void;
}

const StoresContext = createContext<StoresContextValue | undefined>(undefined);

export function StoresProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const stores = useAppSelector((state) => state.stores.stores);
  const ready = useAppSelector((state) => state.stores.ready);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        dispatch(setStores(JSON.parse(stored)));
        return;
      }
    } catch {
      // ignore, fall through to seeding from the static catalog
    }

    fetchJson<Store[]>("/data/stores.json")
      .then((seed) => dispatch(setStores(seed)))
      .catch(() => dispatch(setStores([])));
  }, [dispatch]);

  return (
    <StoresContext.Provider
      value={{
        stores,
        loading: !ready,
        addStore: (store) => dispatch(addStoreAction(store)),
        updateStoreStatus: (storeId, status) => dispatch(updateStoreStatusAction({ storeId, status })),
      }}
    >
      {children}
    </StoresContext.Provider>
  );
}

export function useStores() {
  const ctx = useContext(StoresContext);
  if (!ctx) throw new Error("useStores must be used within StoresProvider");
  return ctx;
}
