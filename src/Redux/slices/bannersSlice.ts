import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Banner } from "@/types";

interface BannersState {
  /** The homepage banner slider's slides. Seeded once from /data/banners.json, then owned by localStorage. */
  banners: Banner[];
  ready: boolean;
}

const STORAGE_KEY = "velora_banners";

const initialState: BannersState = {
  banners: [],
  ready: false,
};

const persist = (state: BannersState) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.banners));
  } catch {
    // ignore
  }
};

const bannersSlice = createSlice({
  name: "banners",
  initialState,
  reducers: {
    setBanners: (state, action: PayloadAction<Banner[]>) => {
      state.banners = action.payload;
      state.ready = true;
      persist(state);
    },
    addBanner: (state, action: PayloadAction<{ title: string }>) => {
      const title = action.payload.title.trim();
      if (!title) return;
      state.banners.push({
        id: `banner-${Date.now()}`,
        title,
        subtitle: "",
      });
      persist(state);
    },
    updateBanner: (state, action: PayloadAction<{ id: string; title?: string; subtitle?: string }>) => {
      const { id, title, subtitle } = action.payload;
      const banner = state.banners.find((b) => b.id === id);
      if (!banner) return;
      if (title !== undefined) banner.title = title.trim();
      if (subtitle !== undefined) banner.subtitle = subtitle.trim();
      persist(state);
    },
    updateBannerImage: (state, action: PayloadAction<{ id: string; imageUrl: string | undefined }>) => {
      const { id, imageUrl } = action.payload;
      const banner = state.banners.find((b) => b.id === id);
      if (!banner) return;
      banner.imageUrl = imageUrl;
      persist(state);
    },
    deleteBanner: (state, action: PayloadAction<string>) => {
      state.banners = state.banners.filter((b) => b.id !== action.payload);
      persist(state);
    },
    moveBanner: (state, action: PayloadAction<{ id: string; direction: "up" | "down" }>) => {
      const { id, direction } = action.payload;
      const index = state.banners.findIndex((b) => b.id === id);
      if (index === -1) return;
      const swapWith = direction === "up" ? index - 1 : index + 1;
      if (swapWith < 0 || swapWith >= state.banners.length) return;
      [state.banners[index], state.banners[swapWith]] = [state.banners[swapWith], state.banners[index]];
      persist(state);
    },
  },
});

export const { setBanners, addBanner, updateBanner, updateBannerImage, deleteBanner, moveBanner } =
  bannersSlice.actions;
export default bannersSlice.reducer;
