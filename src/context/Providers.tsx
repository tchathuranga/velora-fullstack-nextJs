"use client";

import { useState } from "react";
import { Provider } from "react-redux";
import { makeStore } from "@/Redux/store";
import { AuthProvider } from "./AuthContext";
import { CartProvider } from "./CartContext";
import { WishlistProvider } from "./WishlistContext";
import { RecentlyViewedProvider } from "./RecentlyViewedContext";
import { ProductsProvider } from "./ProductsContext";
import { CategoriesProvider } from "./CategoriesContext";
import { StoresProvider } from "./StoresContext";
import { BannersProvider } from "./BannersContext";

export function Providers({ children }: { children: React.ReactNode }) {
  // Created once per app mount (not at module scope) via useState's lazy initializer, so
  // Fast Refresh / HMR re-executing this module doesn't spawn a new store instance and
  // orphan the Redux DevTools connection.
  const [store] = useState(() => makeStore());

  return (
    <Provider store={store}>
      <AuthProvider>
        <StoresProvider>
          <CategoriesProvider>
            <BannersProvider>
              <ProductsProvider>
                <CartProvider>
                  <WishlistProvider>
                    <RecentlyViewedProvider>{children}</RecentlyViewedProvider>
                  </WishlistProvider>
                </CartProvider>
              </ProductsProvider>
            </BannersProvider>
          </CategoriesProvider>
        </StoresProvider>
      </AuthProvider>
    </Provider>
  );
}
