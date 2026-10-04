import { Category, Product, Subcategory } from "@/types";

export function getCategoryBySlug(categories: Category[], slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}

export function getCategoryById(categories: Category[], id: string): Category | undefined {
  return categories.find((c) => c.id === id);
}

export function getSubcategoryById(category: Category | undefined, id: string): Subcategory | undefined {
  return category?.subcategories.find((s) => s.id === id);
}

export function getProductsByCategory(products: Product[], categoryId: string, subcategoryId?: string): Product[] {
  return products.filter(
    (p) => p.categoryId === categoryId && (!subcategoryId || p.subcategoryId === subcategoryId),
  );
}
