"use client";

import { createContext, useContext, useMemo } from "react";
import { CreateProductInput, useCreateProductMutation, useGetProductsQuery } from "@/Redux/api";
import type { Product } from "@/types";

interface ProductsContextValue {
  /** The public catalog (approved stores only), newest first. Photos are trimmed to the cover image. */
  products: Product[];
  loading: boolean;
  /** Approved sellers only; rejects with the API error. */
  addProduct: (input: CreateProductInput) => Promise<Product>;
}

const ProductsContext = createContext<ProductsContextValue | undefined>(undefined);
const EMPTY: Product[] = [];

export function ProductsProvider({ children }: { children: React.ReactNode }) {
  const { data, isLoading } = useGetProductsQuery();
  const [createProduct] = useCreateProductMutation();

  const value = useMemo<ProductsContextValue>(
    () => ({
      products: data ?? EMPTY,
      loading: isLoading,
      addProduct: (input) => createProduct(input).unwrap(),
    }),
    [data, isLoading, createProduct],
  );

  return <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>;
}

export function useProducts() {
  const ctx = useContext(ProductsContext);
  if (!ctx) throw new Error("useProducts must be used within ProductsProvider");
  return ctx;
}
