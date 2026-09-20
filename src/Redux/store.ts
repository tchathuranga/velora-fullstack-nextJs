import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@/Redux/slices/authSlice";
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
