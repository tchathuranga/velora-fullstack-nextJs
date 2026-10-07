import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { requireSeller } from "@/server/auth";
import { query, queryOne } from "@/server/db";
import { badRequest, ok, parseBody, route } from "@/server/http";
import { ProductRow, productSelect, toProduct } from "@/server/serializers";
import { createProductSchema, slugify } from "@/server/validation";

/** Public catalog (approved stores only), newest first. Photos are trimmed to the cover image. */
export const GET = route(async () => {
  const rows = await query<ProductRow>(
    `SELECT ${productSelect(false)}
       FROM products p JOIN stores s ON s.id = p.store_id AND s.status = 'active'
      ORDER BY p.created_at DESC`,
  );
  return ok(rows.map(toProduct));
});

/** An approved seller lists a new product in their own store. */
export const POST = route(async (req) => {
  const session = await requireSeller(req);
  const input = await parseBody(req, createProductSchema);

  if (input.subcategoryId) {
    const valid = await queryOne("SELECT 1 FROM subcategories WHERE id = $1 AND category_id = $2", [
      input.subcategoryId,
      input.categoryId ?? null,
    ]);
    if (!valid) throw badRequest("That subcategory doesn't belong to the selected category.");
  }

  const slug = `${slugify(input.title, "product")}-${randomBytes(3).toString("hex")}`;
  const created = await queryOne<{ id: string }>(
    `INSERT INTO products (slug, store_id, category_id, subcategory_id, title, price, quantity, brand, size, color,
                           package_include, custom_specs, description, handling_time, delivery_time, delivery_fee,
                           free_delivery, payment_methods, location, images, variations)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
     RETURNING id`,
    [
      slug,
      session.storeId,
      input.categoryId ?? null,
      input.subcategoryId ?? null,
      input.title,
      input.price,
      input.quantity,
      input.brand || null,
      input.size || null,
      input.color || null,
      input.packageInclude || null,
      JSON.stringify(input.customSpecs.filter((s) => s.label && s.value)),
      input.description,
      input.handlingTime,
      input.deliveryTime,
      input.freeDelivery ? 0 : input.deliveryFee,
      input.freeDelivery,
      input.paymentMethods,
      input.location,
      JSON.stringify(input.images),
      input.variations ? JSON.stringify(input.variations) : null,
    ],
  );

  const row = await queryOne<ProductRow>(`SELECT ${productSelect(false)} FROM products p WHERE p.id = $1`, [created!.id]);
  return NextResponse.json(toProduct(row!), { status: 201 });
});
