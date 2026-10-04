"use client";

import { createContext, useContext, useEffect, useMemo } from "react";
import { Product } from "@/types";
import { fetchJson } from "@/lib/fetchJson";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { addUserProduct, hydrateUserProducts, setCatalog, setCatalogLoading } from "@/store/productsSlice";

const STORAGE_KEY = "velora_user_products";

interface ProductsContextValue {
  /** Seller-listed products merged with the static catalog, newest listings first. */
  products: Product[];
  loading: boolean;
  addProduct: (product: Product) => void;
}

const ProductsContext = createContext<ProductsContextValue | undefined>(undefined);

export function ProductsProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const catalog = useAppSelector((state) => state.products.catalog);
  const catalogStatus = useAppSelector((state) => state.products.catalogStatus);
  const userProducts = useAppSelector((state) => state.products.userProducts);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) dispatch(hydrateUserProducts(JSON.parse(stored)));
    } catch {
      // ignore
    }
  }, [dispatch]);

  useEffect(() => {
    if (catalogStatus !== "idle") return;
    dispatch(setCatalogLoading());
    fetchJson<Product[]>("/data/products.json")
      .then((data) => dispatch(setCatalog(data)))
      .catch(() => dispatch(setCatalog([])));
  }, [catalogStatus, dispatch]);

  const products = useMemo(() => [...userProducts, ...catalog], [userProducts, catalog]);

  const addProduct = (product: Product) => dispatch(addUserProduct(product));

  return (
    <ProductsContext.Provider value={{ products, loading: catalogStatus !== "loaded", addProduct }}>
      {children}
    </ProductsContext.Provider>
  );
}

export function useProducts() {
  const ctx = useContext(ProductsContext);
  if (!ctx) throw new Error("useProducts must be used within ProductsProvider");
  return ctx;
}
