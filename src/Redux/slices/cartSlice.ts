import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { PaymentMethod, Product, VariationCombination } from "@/types";

export interface CartItem {
  productId: string;
  slug?: string;
  title: string;
  price: number;
  quantity: number;
  icon: string;
  storeId: string;
  /** The payment methods this product's seller accepts, snapshotted at add-to-cart time. */
  paymentMethods: PaymentMethod[];
  /** The chosen variation of a listing that has variations (each variation is its own cart line). */
  variationId?: string;
  variation?: Record<string, string>;
  /** Shipping snapshotted at add-to-cart time; the cart and checkout re-read the live listing. Absent on old carts. */
  deliveryFee?: number;
  extraDeliveryFee?: number;
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

const sameLine = (item: CartItem, productId: string, variationId?: string) =>
  item.productId === productId && (item.variationId ?? "") === (variationId ?? "");

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    hydrateCart: (state, action: PayloadAction<CartItem[] | null | undefined>) => {
      state.items = action.payload ?? [];
      persistCart(state);
    },
    addToCart: (state, action: PayloadAction<{ product: Product; quantity?: number; combination?: VariationCombination }>) => {
      const { product, quantity = 1, combination } = action.payload;
      const existing = state.items.find((item) => sameLine(item, product.id, combination?.id));

      if (existing) {
        existing.quantity += quantity;
      } else {
        state.items.push({
          productId: product.id,
          slug: product.slug,
          title: product.title,
          price: combination?.price ?? product.price,
          quantity,
          icon: product.icon,
          storeId: product.storeId,
          paymentMethods: product.paymentMethods,
          ...(combination ? { variationId: combination.id, variation: combination.values } : {}),
          deliveryFee: product.freeDelivery ? 0 : product.deliveryFee,
          extraDeliveryFee: product.freeDelivery ? 0 : product.extraDeliveryFee,
        });
      }

      persistCart(state);
    },
    removeFromCart: (state, action: PayloadAction<{ productId: string; variationId?: string }>) => {
      const { productId, variationId } = action.payload;
      state.items = state.items.filter((item) => !sameLine(item, productId, variationId));
      persistCart(state);
    },
    updateQuantity: (state, action: PayloadAction<{ productId: string; variationId?: string; quantity: number }>) => {
      const { productId, variationId, quantity } = action.payload;
      const item = state.items.find((entry) => sameLine(entry, productId, variationId));
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
