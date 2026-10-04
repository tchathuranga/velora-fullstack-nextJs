"use client";

import { createContext, useContext, useEffect, useRef } from "react";
import { Category } from "@/types";
import { fetchJson } from "@/lib/fetchJson";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addCategory as addCategoryAction,
  addSubcategory as addSubcategoryAction,
  deleteCategory as deleteCategoryAction,
  deleteSubcategory as deleteSubcategoryAction,
  setCategories,
  updateCategory as updateCategoryAction,
  updateSubcategory as updateSubcategoryAction,
} from "@/store/categoriesSlice";

const STORAGE_KEY = "velora_categories";

interface CategoriesContextValue {
  categories: Category[];
  loading: boolean;
  addCategory: (name: string) => void;
  updateCategory: (id: string, name: string) => void;
  deleteCategory: (id: string) => void;
  addSubcategory: (categoryId: string, name: string) => void;
  updateSubcategory: (categoryId: string, subcategoryId: string, name: string) => void;
  deleteSubcategory: (categoryId: string, subcategoryId: string) => void;
}

const CategoriesContext = createContext<CategoriesContextValue | undefined>(undefined);

export function CategoriesProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const categories = useAppSelector((state) => state.categories.categories);
  const ready = useAppSelector((state) => state.categories.ready);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        dispatch(setCategories(JSON.parse(stored)));
        return;
      }
    } catch {
      // ignore, fall through to seeding from the static catalog
    }

    fetchJson<Category[]>("/data/categories.json")
      .then((seed) => dispatch(setCategories(seed)))
      .catch(() => dispatch(setCategories([])));
  }, [dispatch]);

  return (
    <CategoriesContext.Provider
      value={{
        categories,
        loading: !ready,
        addCategory: (name) => dispatch(addCategoryAction({ name })),
        updateCategory: (id, name) => dispatch(updateCategoryAction({ id, name })),
        deleteCategory: (id) => dispatch(deleteCategoryAction(id)),
        addSubcategory: (categoryId, name) => dispatch(addSubcategoryAction({ categoryId, name })),
        updateSubcategory: (categoryId, subcategoryId, name) =>
          dispatch(updateSubcategoryAction({ categoryId, subcategoryId, name })),
        deleteSubcategory: (categoryId, subcategoryId) =>
          dispatch(deleteSubcategoryAction({ categoryId, subcategoryId })),
      }}
    >
      {children}
    </CategoriesContext.Provider>
  );
}

export function useCategories() {
  const ctx = useContext(CategoriesContext);
  if (!ctx) throw new Error("useCategories must be used within CategoriesProvider");
  return ctx;
}
