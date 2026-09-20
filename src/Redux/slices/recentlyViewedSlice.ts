import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface RecentlyViewedState {
  productIds: string[];
}

const STORAGE_KEY = "velora_recently_viewed";
const MAX_ITEMS = 12;

const initialState: RecentlyViewedState = { productIds: [] };

const persistRecentlyViewed = (state: RecentlyViewedState) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.productIds));
  } catch {
    // ignore
  }
};

const recentlyViewedSlice = createSlice({
  name: "recentlyViewed",
  initialState,
  reducers: {
    hydrateRecentlyViewed: (state, action: PayloadAction<string[] | null | undefined>) => {
      state.productIds = action.payload ?? [];
      persistRecentlyViewed(state);
    },
    addViewed: (state, action: PayloadAction<string>) => {
      const productId = action.payload;
      state.productIds = [productId, ...state.productIds.filter((id) => id !== productId)].slice(0, MAX_ITEMS);
      persistRecentlyViewed(state);
    },
  },
});

export const { hydrateRecentlyViewed, addViewed } = recentlyViewedSlice.actions;
export default recentlyViewedSlice.reducer;
