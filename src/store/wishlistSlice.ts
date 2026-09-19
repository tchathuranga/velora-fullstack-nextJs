import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface WishlistState {
  productIds: string[];
}

const STORAGE_KEY = "velora_wishlist";

const initialState: WishlistState = { productIds: [] };

const persistWishlist = (state: WishlistState) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.productIds));
  } catch {
    // ignore
  }
};

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState,
  reducers: {
    hydrateWishlist: (state, action: PayloadAction<string[] | null | undefined>) => {
      state.productIds = action.payload ?? [];
      persistWishlist(state);
    },
    toggleWishlist: (state, action: PayloadAction<string>) => {
      const productId = action.payload;
      if (state.productIds.includes(productId)) {
        state.productIds = state.productIds.filter((id) => id !== productId);
      } else {
        state.productIds.push(productId);
      }
      persistWishlist(state);
    },
  },
});

export const { hydrateWishlist, toggleWishlist } = wishlistSlice.actions;
export default wishlistSlice.reducer;
