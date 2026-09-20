"use client";

import { createContext, useContext, useEffect, useMemo } from "react";
import { Product } from "@/types";
import { useAppDispatch, useAppSelector } from "@/Redux/hooks";
import {
  addToCart as addToCartAction,
  clearCart as clearCartAction,
  hydrateCart,
  removeFromCart as removeFromCartAction,
  updateQuantity as updateQuantityAction,
} from "@/Redux/slices/cartSlice";

export interface CartItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  icon: string;
  storeId: string;
}

interface CartContextValue {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  subtotal: number;
  itemCount: number;
  atCapacity: boolean;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);
export const MAX_CART_ITEMS = 100;

export function CartProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const items = useAppSelector((state) => state.cart.items);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const stored = window.localStorage.getItem("velora_cart");
      if (stored) {
        dispatch(hydrateCart(JSON.parse(stored)));
      }
    } catch {
      // ignore
    }
  }, [dispatch]);

  const itemCount = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);
  const subtotal = useMemo(() => items.reduce((sum, i) => sum + i.price * i.quantity, 0), [items]);

  const addToCart = (product: Product, quantity = 1) => {
    const currentTotal = items.reduce((sum, item) => sum + item.quantity, 0);
    const allowedToAdd = Math.max(0, MAX_CART_ITEMS - currentTotal);
    const safeQuantity = Math.min(quantity, allowedToAdd || quantity);
    dispatch(addToCartAction({ product, quantity: safeQuantity }));
  };

  const removeFromCart = (productId: string) => {
    dispatch(removeFromCartAction(productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    dispatch(updateQuantityAction({ productId, quantity: Math.max(1, Math.min(MAX_CART_ITEMS, quantity)) }));
  };

  const clearCart = () => dispatch(clearCartAction());

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        subtotal,
        itemCount,
        atCapacity: itemCount >= MAX_CART_ITEMS,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
