import { z } from "zod";
import { queryOne } from "./db";
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
  "handling_time",
  "delivery_time",
  "delivery_fee",
  "extra_delivery_fee",
  "free_delivery",
  "returns_accepted",
  "payment_methods",
  "location",
  "images",
  "variations",
] as const;

/**
 * Values for PRODUCT_COLUMNS. For listings with variations, the stock is the sum of the variations' stock and the
 * headline price is the cheapest variation, so lists, "Out of Stock" and the order flow all agree with the variation table.
 */
export function productValues(input: ProductInput): unknown[] {
  const combos = input.variations?.combinations ?? [];
  const hasVariations = Boolean(input.variations && combos.length > 0);
  const quantity = hasVariations ? combos.reduce((sum, c) => sum + c.quantity, 0) : input.quantity;
  const price = hasVariations ? Math.min(...combos.map((c) => c.price)) : input.price;

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
    input.handlingTime,
    input.deliveryTime,
    input.freeDelivery ? 0 : input.deliveryFee,
    input.freeDelivery ? 0 : input.extraDeliveryFee,
    input.freeDelivery,
    input.returnsAccepted,
    input.paymentMethods,
    input.location,
    JSON.stringify(input.images),
    hasVariations ? JSON.stringify(input.variations) : null,
  ];
}

export async function assertSubcategoryMatches(input: ProductInput) {
  if (!input.subcategoryId) return;
  const valid = await queryOne("SELECT 1 FROM subcategories WHERE id = $1 AND category_id = $2", [
    input.subcategoryId,
    input.categoryId ?? null,
  ]);
  if (!valid) throw badRequest("That subcategory doesn't belong to the selected category.");
}
