import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { SellerStatus, Store } from "@/types";

interface StoresState {
  /** The full, currently-managed store list. Seeded once from /data/stores.json, then owned by localStorage. */
  stores: Store[];
  ready: boolean;
}

const STORAGE_KEY = "velora_stores";

const initialState: StoresState = {
  stores: [],
  ready: false,
};

const persist = (state: StoresState) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.stores));
  } catch {
    // ignore
  }
};

const storesSlice = createSlice({
  name: "stores",
  initialState,
  reducers: {
    setStores: (state, action: PayloadAction<Store[]>) => {
      state.stores = action.payload;
      state.ready = true;
      persist(state);
    },
    addStore: (state, action: PayloadAction<Store>) => {
      state.stores.unshift(action.payload);
      persist(state);
    },
    updateStoreStatus: (state, action: PayloadAction<{ storeId: string; status: SellerStatus }>) => {
      const store = state.stores.find((s) => s.id === action.payload.storeId);
      if (store) store.status = action.payload.status;
      persist(state);
    },
  },
});

export const { setStores, addStore, updateStoreStatus } = storesSlice.actions;
export default storesSlice.reducer;
