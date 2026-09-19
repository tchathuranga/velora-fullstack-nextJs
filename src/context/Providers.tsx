"use client";

import { useState } from "react";
import { Provider } from "react-redux";
import { makeStore } from "@/store/store";
import { AuthProvider } from "./AuthContext";
import { CartProvider } from "./CartContext";
import { WishlistProvider } from "./WishlistContext";
import { RecentlyViewedProvider } from "./RecentlyViewedContext";

export function Providers({ children }: { children: React.ReactNode }) {
  // Created once per app mount (not at module scope) via useState's lazy initializer, so
  // Fast Refresh / HMR re-executing this module doesn't spawn a new store instance and
  // orphan the Redux DevTools connection.
  const [store] = useState(() => makeStore());

  return (
    <Provider store={store}>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <RecentlyViewedProvider>{children}</RecentlyViewedProvider>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </Provider>
  );
}
