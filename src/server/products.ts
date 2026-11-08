import type { PoolClient } from "pg";
import { z } from "zod";
import { queryOne } from "./db";
import { parseDayRange } from "@/lib/shipping";
import { badRequest } from "./http";
import { createProductSchema } from "./validation";

export type ProductInput = z.infer<typeof createProductSchema>;

/** Column order shared by the INSERT and UPDATE statements. */
export const PRODUCT_COLUMNS = [
  "category_id",
  "subcategory_id",
  "title",
  "price",
  "quantity",
  "brand",
  "condition",
  "size",
  "color",
  "package_include",
  "custom_specs",
  "description",
  "handling_days_min",
  "handling_days_max",
  "delivery_days_min",
  "delivery_days_max",
  "delivery_fee",
  "extra_delivery_fee",
  "free_delivery",
  "returns_accepted",
  "payment_methods",
  "location",
  "images",
  "compare_at_price",
  "sale_ends_at",
] as const;

/**
 * Values for PRODUCT_COLUMNS. For listings with variations, the stock is the sum of the variations' stock and the
 * headline price is the cheapest variation (the database keeps them in step afterwards, see saveVariations), so lists,
 * "Out of Stock" and the order flow all agree with the variants.
 */
export function productValues(input: ProductInput): unknown[] {
  const combos = input.variations?.combinations ?? [];
  const hasVariations = Boolean(input.variations && combos.length > 0);
  const quantity = hasVariations ? combos.reduce((sum, c) => sum + c.quantity, 0) : input.quantity;
  const price = hasVariations ? Math.min(...combos.map((c) => c.price)) : input.price;
  // The schema guarantees a number of days in both; the database stores them as whole numbers.
  const handling = parseDayRange(input.handlingTime) ?? { min: 0, max: 0 };
  const delivery = parseDayRange(input.deliveryTime) ?? { min: 0, max: 0 };
  const onSale = input.compareAtPrice != null && !hasVariations;

  return [
    input.categoryId ?? null,
    input.subcategoryId ?? null,
    input.title,
    price,
    quantity,
    input.brand,
    input.condition,
    input.size || null,
    input.color || null,
    input.packageInclude || null,
    JSON.stringify(input.customSpecs.filter((s) => s.label && s.value)),
    input.description,
    handling.min,
    handling.max,
    delivery.min,
    delivery.max,
    input.freeDelivery ? 0 : input.deliveryFee,
    input.freeDelivery ? 0 : input.extraDeliveryFee,
    input.freeDelivery,
    input.returnsAccepted,
    input.paymentMethods,
    input.location,
    JSON.stringify(input.images),
    onSale ? input.compareAtPrice : null,
    onSale ? (input.saleEndsAt ?? null) : null,
  ];
}

/**
 * Replaces a listing's variations (attributes, options, photos, priced and stocked variants) inside the caller's
 * transaction. Variants are matched by id so one that survives an edit keeps its identity; pass null for "no variations".
 * A database trigger then keeps products.quantity / products.price equal to the variants' total stock / cheapest price.
 */
export async function saveVariations(client: PoolClient, productId: string, variations: ProductInput["variations"]) {
  const has = Boolean(variations && variations.combinations.length > 0);
  await client.query("SELECT replace_product_variations($1, $2::jsonb)", [productId, has ? JSON.stringify(variations) : null]);
}

export async function assertSubcategoryMatches(input: ProductInput) {
  if (!input.subcategoryId) return;
  const valid = await queryOne("SELECT 1 FROM subcategories WHERE id = $1 AND category_id = $2", [
    input.subcategoryId,
    input.categoryId ?? null,
  ]);
  if (!valid) throw badRequest("That subcategory doesn't belong to the selected category.");
}
