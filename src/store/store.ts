import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@/store/authSlice";
import cartReducer from "@/store/cartSlice";
import wishlistReducer from "@/store/wishlistSlice";
import recentlyViewedReducer from "@/store/recentlyViewedSlice";
import headerReducer from "@/store/headerSlice";
import checkoutReducer from "@/store/checkoutSlice";
import productFormReducer from "@/store/productFormSlice";
import uiReducer from "@/store/uiSlice";

export function makeStore() {
  return configureStore({
    reducer: {
      auth: authReducer,
      cart: cartReducer,
      wishlist: wishlistReducer,
      recentlyViewed: recentlyViewedReducer,
      header: headerReducer,
      checkout: checkoutReducer,
      productForm: productFormReducer,
      ui: uiReducer,
    },
  });
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
