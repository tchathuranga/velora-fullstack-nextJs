import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Category } from "@/types";

interface CategoriesState {
  /** The full, currently-managed category list. Seeded once from /data/categories.json, then owned by localStorage. */
  categories: Category[];
  ready: boolean;
}

const STORAGE_KEY = "velora_categories";

const initialState: CategoriesState = {
  categories: [],
  ready: false,
};

const persist = (state: CategoriesState) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.categories));
  } catch {
    // ignore
  }
};

function slugify(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "category";
}

const categoriesSlice = createSlice({
  name: "categories",
  initialState,
  reducers: {
    setCategories: (state, action: PayloadAction<Category[]>) => {
      state.categories = action.payload;
      state.ready = true;
      persist(state);
    },
    addCategory: (state, action: PayloadAction<{ name: string }>) => {
      const name = action.payload.name.trim();
      if (!name) return;
      state.categories.push({
        id: `cat-${Date.now()}`,
        name,
        slug: slugify(name),
        subcategories: [],
      });
      persist(state);
    },
    updateCategory: (state, action: PayloadAction<{ id: string; name: string }>) => {
      const { id, name } = action.payload;
      const category = state.categories.find((c) => c.id === id);
      if (category && name.trim()) category.name = name.trim();
      persist(state);
    },
    deleteCategory: (state, action: PayloadAction<string>) => {
      state.categories = state.categories.filter((c) => c.id !== action.payload);
      persist(state);
    },
    addSubcategory: (state, action: PayloadAction<{ categoryId: string; name: string }>) => {
      const { categoryId, name } = action.payload;
      const trimmed = name.trim();
      if (!trimmed) return;
      const category = state.categories.find((c) => c.id === categoryId);
      if (!category) return;
      category.subcategories.push({
        id: `sub-${Date.now()}`,
        name: trimmed,
        slug: slugify(trimmed),
      });
      persist(state);
    },
    updateSubcategory: (
      state,
      action: PayloadAction<{ categoryId: string; subcategoryId: string; name: string }>,
    ) => {
      const { categoryId, subcategoryId, name } = action.payload;
      const category = state.categories.find((c) => c.id === categoryId);
      const subcategory = category?.subcategories.find((s) => s.id === subcategoryId);
      if (subcategory && name.trim()) subcategory.name = name.trim();
      persist(state);
    },
    deleteSubcategory: (state, action: PayloadAction<{ categoryId: string; subcategoryId: string }>) => {
      const { categoryId, subcategoryId } = action.payload;
      const category = state.categories.find((c) => c.id === categoryId);
      if (!category) return;
      category.subcategories = category.subcategories.filter((s) => s.id !== subcategoryId);
      persist(state);
    },
  },
});

export const {
  setCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  addSubcategory,
  updateSubcategory,
  deleteSubcategory,
} = categoriesSlice.actions;
export default categoriesSlice.reducer;
