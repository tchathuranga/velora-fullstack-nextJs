import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Product } from "@/types";

interface ProductsState {
  /** Loaded once from /data/products.json. */
  catalog: Product[];
  catalogStatus: "idle" | "loading" | "loaded";
  /** Listed by sellers through the app (not part of the static catalog); persisted to localStorage. */
  userProducts: Product[];
}

const STORAGE_KEY = "velora_user_products";

const initialState: ProductsState = {
  catalog: [],
  catalogStatus: "idle",
  userProducts: [],
};

const persistUserProducts = (state: ProductsState) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.userProducts));
  } catch {
    // ignore
  }
};

const productsSlice = createSlice({
  name: "products",
  initialState,
  reducers: {
    setCatalogLoading: (state) => {
      state.catalogStatus = "loading";
    },
    setCatalog: (state, action: PayloadAction<Product[]>) => {
      state.catalog = action.payload;
      state.catalogStatus = "loaded";
    },
    hydrateUserProducts: (state, action: PayloadAction<Product[] | null | undefined>) => {
      state.userProducts = action.payload ?? [];
    },
    addUserProduct: (state, action: PayloadAction<Product>) => {
      state.userProducts.unshift(action.payload);
      persistUserProducts(state);
    },
  },
});

export const { setCatalogLoading, setCatalog, hydrateUserProducts, addUserProduct } = productsSlice.actions;
export default productsSlice.reducer;
