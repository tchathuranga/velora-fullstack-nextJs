import { Product } from "@/types";

export function getProductBySlug(products: Product[], slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getProductsByStore(products: Product[], storeId: string): Product[] {
  return products.filter((p) => p.storeId === storeId);
}

export function getProductsByTag(products: Product[], tag: Product["tags"][number], limit = 6): Product[] {
  return products.filter((p) => p.tags.includes(tag)).slice(0, limit);
}

export function getRelatedProducts(products: Product[], product: Product, limit = 6): Product[] {
  return products
    .filter((p) => p.id !== product.id && p.storeId === product.storeId)
    .concat(products.filter((p) => p.id !== product.id && p.storeId !== product.storeId))
    .slice(0, limit);
}
