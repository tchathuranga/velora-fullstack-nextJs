"use client";

import { createContext, useContext, useMemo } from "react";
import { CreateProductInput, useCreateProductMutation, useGetProductsQuery } from "@/Redux/api";
import type { Product } from "@/types";

interface ProductsContextValue {
  /** Approved sellers only; rejects with the API error. */
  addProduct: (input: CreateProductInput) => Promise<Product>;
}

const ProductsContext = createContext<ProductsContextValue | undefined>(undefined);
const EMPTY: Product[] = [];

export function ProductsProvider({ children }: { children: React.ReactNode }) {
  const [createProduct] = useCreateProductMutation();
  const value = useMemo<ProductsContextValue>(() => ({ addProduct: (input) => createProduct(input).unwrap() }), [createProduct]);
  return <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>;
}

/**
 * The whole public catalog (approved stores, newest first) plus `addProduct`. The catalog is fetched by the pages that call this
 * hook (RTK Query shares one cached copy), not on every page: the home page loads only the few products its sections show.
 */
export function useProducts() {
  const ctx = useContext(ProductsContext);
  if (!ctx) throw new Error("useProducts must be used within ProductsProvider");
  const { data, isLoading } = useGetProductsQuery();
  return useMemo(() => ({ products: data ?? EMPTY, loading: isLoading, addProduct: ctx.addProduct }), [data, isLoading, ctx.addProduct]);
}
