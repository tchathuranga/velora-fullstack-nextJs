"use client";

import { createContext, useContext, useMemo } from "react";
import {
  useAddCategoryMutation,
  useAddSubcategoryMutation,
  useDeleteCategoryMutation,
  useDeleteSubcategoryMutation,
  useGetCategoriesQuery,
  useRenameCategoryMutation,
  useRenameSubcategoryMutation,
} from "@/Redux/api";
import type { Category } from "@/types";

interface CategoriesContextValue {
  categories: Category[];
  loading: boolean;
  /** Mutations are admin-only and reject with the API error. */
  addCategory: (name: string) => Promise<void>;
  updateCategory: (id: string, name: string) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addSubcategory: (categoryId: string, name: string) => Promise<void>;
  updateSubcategory: (categoryId: string, subcategoryId: string, name: string) => Promise<void>;
  deleteSubcategory: (categoryId: string, subcategoryId: string) => Promise<void>;
}

const CategoriesContext = createContext<CategoriesContextValue | undefined>(undefined);
const EMPTY: Category[] = [];

export function CategoriesProvider({ children }: { children: React.ReactNode }) {
  const { data, isLoading } = useGetCategoriesQuery();
  const [addCategory] = useAddCategoryMutation();
  const [renameCategory] = useRenameCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();
  const [addSubcategory] = useAddSubcategoryMutation();
  const [renameSubcategory] = useRenameSubcategoryMutation();
  const [deleteSubcategory] = useDeleteSubcategoryMutation();

  const value = useMemo<CategoriesContextValue>(
    () => ({
      categories: data ?? EMPTY,
      loading: isLoading,
      addCategory: async (name) => void (await addCategory({ name }).unwrap()),
      updateCategory: async (id, name) => void (await renameCategory({ id, name }).unwrap()),
      deleteCategory: async (id) => void (await deleteCategory(id).unwrap()),
      addSubcategory: async (categoryId, name) => void (await addSubcategory({ categoryId, name }).unwrap()),
      updateSubcategory: async (categoryId, subcategoryId, name) =>
        void (await renameSubcategory({ categoryId, subcategoryId, name }).unwrap()),
      deleteSubcategory: async (categoryId, subcategoryId) =>
        void (await deleteSubcategory({ categoryId, subcategoryId }).unwrap()),
    }),
    [data, isLoading, addCategory, renameCategory, deleteCategory, addSubcategory, renameSubcategory, deleteSubcategory],
  );

  return <CategoriesContext.Provider value={value}>{children}</CategoriesContext.Provider>;
}

export function useCategories() {
  const ctx = useContext(CategoriesContext);
  if (!ctx) throw new Error("useCategories must be used within CategoriesProvider");
  return ctx;
}
