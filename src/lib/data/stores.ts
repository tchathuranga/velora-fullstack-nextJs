import { Store } from "@/types";

export function getStoreBySlug(stores: Store[], slug: string): Store | undefined {
  return stores.find((s) => s.slug === slug);
}

export function getStoreById(stores: Store[], id: string): Store | undefined {
  return stores.find((s) => s.id === id);
}
