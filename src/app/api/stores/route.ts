import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { requireBuyer } from "@/server/auth";
import { query, queryOne } from "@/server/db";
import { conflict, isUniqueViolation, ok, parseBody, route } from "@/server/http";
import { STORE_SELECT, StoreRow, toStore } from "@/server/serializers";
import { createStoreSchema, slugify } from "@/server/validation";

const PALETTES = [
  { coverColor: "from-indigo-500 to-violet-600", profileColor: "bg-indigo-600" },
  { coverColor: "from-sky-500 to-cyan-600", profileColor: "bg-sky-600" },
  { coverColor: "from-orange-500 to-rose-500", profileColor: "bg-orange-600" },
  { coverColor: "from-emerald-500 to-teal-600", profileColor: "bg-emerald-600" },
  { coverColor: "from-fuchsia-500 to-pink-600", profileColor: "bg-fuchsia-600" },
];

/** Public directory: approved stores only, without contact / bank details. */
export const GET = route(async () => {
  const rows = await query<StoreRow>(
    `SELECT ${STORE_SELECT} FROM stores s WHERE s.status = 'active' ORDER BY s.created_at DESC`,
  );
  return ok(rows.map((r) => toStore(r, false)));
});

/** A signed-in account applies to become a seller; the store starts "under review" until an admin approves it. */
export const POST = route(async (req) => {
  const session = await requireBuyer(req);
  if (session.sellerStoreSlug) throw conflict("You have already created a store.");

  const input = await parseBody(req, createStoreSchema);
  const suffix = randomBytes(3).toString("hex");
  const slug = `${slugify(input.businessName, "store")}-${suffix}`;
  const palette = PALETTES[randomBytes(1)[0] % PALETTES.length];

  let id: string;
  try {
    const row = await queryOne<{ id: string }>(
      `INSERT INTO stores (slug, owner_id, store_name, business_name, full_name, address, telephone, email,
                           about_store, bank_details, bank_details_optional, cover_color, profile_color)
       VALUES ($1, $2, $3, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`,
      [
        slug,
        session.userId,
        input.businessName,
        input.fullName,
        input.address,
        input.telephone,
        input.email,
        input.aboutStore,
        input.bankDetails,
        input.bankDetailsOptional ?? null,
        palette.coverColor,
        palette.profileColor,
      ],
    );
    id = row!.id;
  } catch (err) {
    if (isUniqueViolation(err)) throw conflict("You have already created a store.");
    throw err;
  }

  const store = await queryOne<StoreRow>(`SELECT ${STORE_SELECT} FROM stores s WHERE s.id = $1`, [id]);
  return NextResponse.json({ store: toStore(store!, true) }, { status: 201 });
});
