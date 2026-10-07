import { configureStore } from "@reduxjs/toolkit";
import { api } from "@/Redux/api";
import cartReducer from "@/Redux/slices/cartSlice";
import wishlistReducer from "@/Redux/slices/wishlistSlice";
import recentlyViewedReducer from "@/Redux/slices/recentlyViewedSlice";
import headerReducer from "@/Redux/slices/headerSlice";
import checkoutReducer from "@/Redux/slices/checkoutSlice";
import productFormReducer from "@/Redux/slices/productFormSlice";
import uiReducer from "@/Redux/slices/uiSlice";

export function makeStore() {
  return configureStore({
    reducer: {
      // All server data (session, catalog, orders, messages, admin) lives in the RTK Query cache.
      [api.reducerPath]: api.reducer,
      // Client-only state.
      cart: cartReducer,
      wishlist: wishlistReducer,
      recentlyViewed: recentlyViewedReducer,
      header: headerReducer,
      checkout: checkoutReducer,
      productForm: productFormReducer,
      ui: uiReducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware),
  });
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
