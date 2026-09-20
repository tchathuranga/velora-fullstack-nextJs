import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Product } from "@/types";

export interface CartItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  icon: string;
  storeId: string;
}

interface CartState {
  items: CartItem[];
}

const STORAGE_KEY = "velora_cart";

const initialState: CartState = { items: [] };

const persistCart = (state: CartState) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
  } catch {
    // ignore
  }
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    hydrateCart: (state, action: PayloadAction<CartItem[] | null | undefined>) => {
      state.items = action.payload ?? [];
      persistCart(state);
    },
    addToCart: (state, action: PayloadAction<{ product: Product; quantity?: number }>) => {
      const { product, quantity = 1 } = action.payload;
      const existing = state.items.find((item) => item.productId === product.id);

      if (existing) {
        existing.quantity += quantity;
      } else {
        state.items.push({
          productId: product.id,
          title: product.title,
          price: product.price,
          quantity,
          icon: product.icon,
          storeId: product.storeId,
        });
      }

      persistCart(state);
    },
    removeFromCart: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.productId !== action.payload);
      persistCart(state);
    },
    updateQuantity: (state, action: PayloadAction<{ productId: string; quantity: number }>) => {
      const { productId, quantity } = action.payload;
      const item = state.items.find((entry) => entry.productId === productId);
      if (item) {
        item.quantity = Math.max(1, quantity);
      }
      persistCart(state);
    },
    clearCart: (state) => {
      state.items = [];
      persistCart(state);
    },
  },
});

export const { hydrateCart, addToCart, removeFromCart, updateQuantity, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
