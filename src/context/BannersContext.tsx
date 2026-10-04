"use client";

import { createContext, useContext, useEffect, useRef } from "react";
import { Banner } from "@/types";
import { fetchJson } from "@/lib/fetchJson";
import { useAppDispatch, useAppSelector } from "@/Redux/hooks";
import {
  addBanner as addBannerAction,
  deleteBanner as deleteBannerAction,
  moveBanner as moveBannerAction,
  setBanners,
  updateBanner as updateBannerAction,
  updateBannerImage as updateBannerImageAction,
} from "@/Redux/slices/bannersSlice";

const STORAGE_KEY = "velora_banners";

interface BannersContextValue {
  banners: Banner[];
  loading: boolean;
  addBanner: (title: string) => void;
  updateBanner: (id: string, fields: { title?: string; subtitle?: string }) => void;
  updateBannerImage: (id: string, imageUrl: string | undefined) => void;
  deleteBanner: (id: string) => void;
  moveBanner: (id: string, direction: "up" | "down") => void;
}

const BannersContext = createContext<BannersContextValue | undefined>(undefined);

export function BannersProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const banners = useAppSelector((state) => state.banners.banners);
  const ready = useAppSelector((state) => state.banners.ready);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        dispatch(setBanners(JSON.parse(stored)));
        return;
      }
    } catch {
      // ignore, fall through to seeding from the static catalog
    }

    fetchJson<Banner[]>("/data/banners.json")
      .then((seed) => dispatch(setBanners(seed)))
      .catch(() => dispatch(setBanners([])));
  }, [dispatch]);

  return (
    <BannersContext.Provider
      value={{
        banners,
        loading: !ready,
        addBanner: (title) => dispatch(addBannerAction({ title })),
        updateBanner: (id, fields) => dispatch(updateBannerAction({ id, ...fields })),
        updateBannerImage: (id, imageUrl) => dispatch(updateBannerImageAction({ id, imageUrl })),
        deleteBanner: (id) => dispatch(deleteBannerAction(id)),
        moveBanner: (id, direction) => dispatch(moveBannerAction({ id, direction })),
      }}
    >
      {children}
    </BannersContext.Provider>
  );
}

export function useBanners() {
  const ctx = useContext(BannersContext);
  if (!ctx) throw new Error("useBanners must be used within BannersProvider");
  return ctx;
}
