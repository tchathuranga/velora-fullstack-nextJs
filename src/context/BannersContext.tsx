"use client";

import { createContext, useContext, useMemo } from "react";
import {
  useAddBannerMutation,
  useDeleteBannerMutation,
  useGetBannersQuery,
  useMoveBannerMutation,
  useUpdateBannerMutation,
} from "@/Redux/api";
import type { Banner } from "@/types";

interface BannersContextValue {
  banners: Banner[];
  loading: boolean;
  /** Mutations are admin-only and reject with the API error. */
  addBanner: (title: string) => Promise<void>;
  updateBanner: (id: string, fields: { title?: string; subtitle?: string }) => Promise<void>;
  updateBannerImage: (id: string, imageUrl: string | undefined) => Promise<void>;
  deleteBanner: (id: string) => Promise<void>;
  moveBanner: (id: string, direction: "up" | "down") => Promise<void>;
}

const BannersContext = createContext<BannersContextValue | undefined>(undefined);
const EMPTY: Banner[] = [];

export function BannersProvider({ children }: { children: React.ReactNode }) {
  const { data, isLoading } = useGetBannersQuery();
  const [addBanner] = useAddBannerMutation();
  const [updateBanner] = useUpdateBannerMutation();
  const [deleteBanner] = useDeleteBannerMutation();
  const [moveBanner] = useMoveBannerMutation();

  const value = useMemo<BannersContextValue>(
    () => ({
      banners: data ?? EMPTY,
      loading: isLoading,
      addBanner: async (title) => void (await addBanner({ title }).unwrap()),
      updateBanner: async (id, fields) => void (await updateBanner({ id, ...fields }).unwrap()),
      updateBannerImage: async (id, imageUrl) => void (await updateBanner({ id, imageUrl: imageUrl ?? null }).unwrap()),
      deleteBanner: async (id) => void (await deleteBanner(id).unwrap()),
      moveBanner: async (id, direction) => void (await moveBanner({ id, direction }).unwrap()),
    }),
    [data, isLoading, addBanner, updateBanner, deleteBanner, moveBanner],
  );

  return <BannersContext.Provider value={value}>{children}</BannersContext.Provider>;
}

export function useBanners() {
  const ctx = useContext(BannersContext);
  if (!ctx) throw new Error("useBanners must be used within BannersProvider");
  return ctx;
}
