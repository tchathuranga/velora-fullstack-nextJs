// Adds or removes test data, controlled by a switch in .env.local:
//
//   TEST_DATA=on    -> add the test data (safe to repeat; skipped if already present)
//   TEST_DATA=off   -> remove everything this script added, and nothing else
//
// Run it with:  npm run db:test-data
// It uses TEST_DATABASE_URL when set, otherwise DATABASE_URL.
//
// What "on" adds: the demo seed (categories, 3 buyers, 3 sellers with stores, 8 products, 4 orders, wishlists,
// feedback, banners, demo site contact/bank settings), 4 more categories, 2 variation products (colour/size, several
// images per colour, one sold-out option; one in the legacy one-image shape), 21 more products and 30 on-sale products.
// All of it uses real product photos (see scripts/lib/test-images.mjs); photos are also filled in on demo products,
// categories and banners that were seeded without them.
//
// Everything is identifiable so "off" can find it: usernames start with "demo_", order ids with "ORD-DEMO", product slugs
// with "demo-" / "test-", banner titles with "[Demo]". Real accounts, stores, orders and categories are never touched, and
// a category is only removed if no remaining product uses it.
import { spawnSync } from "node:child_process";
import pg from "pg";
import { sslFor } from "./lib/pg-ssl.mjs";
import { BANNER_IMAGES, CATALOG, CATEGORY_IMAGES, DEMO_PRODUCT_IMAGES, img, imgs } from "./lib/test-images.mjs";

const url = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
const mode = (process.env.TEST_DATA || "").trim().toLowerCase();
if (!url) {
  console.error("DATABASE_URL is not set (expected in .env.local).");
  process.exit(1);
}
if (mode !== "on" && mode !== "off") {
  console.error('Set TEST_DATA=on (add) or TEST_DATA=off (remove) in .env.local, then run this again.');
  process.exit(1);
}

const connect = async () => {
  const c = new pg.Client({ connectionString: url, ssl: sslFor(url) });
  await c.connect();
  return c;
};

const BASE_CATEGORIES = ["Electronics", "Fashion", "Home & Living"];
const EXTRA_CATEGORIES = ["Sports & Fitness", "Toys & Kids", "Books & Stationery", "Vehicles & Auto"];
const slugOf = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

// ───────────────────────── Remove ─────────────────────────
if (mode === "off") {
  const c = await connect();
  try {
    await c.query("BEGIN");
    const orders = await c.query("DELETE FROM orders WHERE id LIKE 'ORD-DEMO%'");
    const prods = await c.query("DELETE FROM products WHERE slug LIKE 'test-%' OR slug LIKE 'demo-%'");
    const users = await c.query("DELETE FROM users WHERE username LIKE 'demo\\_%'"); // cascades stores, wishlists, feedback, conversations
    const banners = await c.query("DELETE FROM banners WHERE title LIKE '[Demo]%'");
    // The demo seed's site contact / bank details, only if they are still the demo values.
    await c.query("DELETE FROM site_settings WHERE key = 'siteContact' AND value::text LIKE '%support@demo.won.lk%'");
    await c.query("DELETE FROM site_settings WHERE key = 'adminBankAccounts' AND value::text LIKE '%9876543210%'");
    // Categories only when nothing real is using them any more.
    const slugs = [...BASE_CATEGORIES, ...EXTRA_CATEGORIES].map(slugOf);
    const cats = await c.query(
      `DELETE FROM categories WHERE slug = ANY($1) AND NOT EXISTS (SELECT 1 FROM products p WHERE p.category_id = categories.id)`,
      [slugs],
    );
    await c.query("COMMIT");
    console.log(`Test data removed: ${users.rowCount} users, ${orders.rowCount} orders, ${prods.rowCount} products, ${banners.rowCount} banners, ${cats.rowCount} categories.`);
  } catch (err) {
    await c.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    await c.end();
  }
  process.exit(0);
}

// ───────────────────────── Add ─────────────────────────
// This script never changes the schema: run `npm run db:reset` yourself first (see docs/DATABASE.md).
let c = await connect();
if (!(await c.query("SELECT to_regclass('users') AS t")).rows[0].t) {
  console.error("The database has no tables yet. Run `npm run db:reset` first.");
  process.exit(1);
}
const hasDemo = (await c.query("SELECT 1 FROM users WHERE username LIKE 'demo\\_%'")).rowCount > 0;
const hasAdmin = (await c.query("SELECT 1 FROM users WHERE role = 'admin'")).rowCount > 0;
await c.end();

const env = { ...process.env, DATABASE_URL: url };
const run = (script) => {
  const r = spawnSync("node", [`scripts/${script}`], { env, encoding: "utf8" });
  console.log(`${script}: ${(r.stdout + r.stderr).trim().split("\n").slice(-2).join(" | ")}`);
  if (r.status !== 0) process.exit(1);
};
// An existing admin is left alone (seeding would reset their password to the one in .env.local).
if (!hasAdmin) run("seed-admin.mjs");
if (!hasDemo) run("seed-demo.mjs");
else console.log("Demo seed already present - skipping.");

c = await connect();
try {
  await c.query("BEGIN");

  let pos = 10;
  for (const name of EXTRA_CATEGORIES) {
    await c.query("INSERT INTO categories (name, slug, position) VALUES ($1,$2,$3) ON CONFLICT (slug) DO NOTHING", [name, slugOf(name), pos++]);
  }

  // Photos for the demo seed's products, categories and banners (only where they have none, so real uploads are kept).
  let photos = 0;
  for (const [title, images] of Object.entries(DEMO_PRODUCT_IMAGES)) {
    photos += (await c.query("UPDATE products SET images = $2::jsonb WHERE slug = $1 AND images = '[]'::jsonb", [`demo-${slugOf(title)}`, JSON.stringify(images)])).rowCount;
  }
  for (const [name, imageUrl] of Object.entries(CATEGORY_IMAGES)) {
    photos += (await c.query("UPDATE categories SET image_url = $2 WHERE slug = $1 AND image_url IS NULL", [slugOf(name), imageUrl])).rowCount;
  }
  for (const [title, imageUrl] of Object.entries(BANNER_IMAGES)) {
    photos += (await c.query("UPDATE banners SET image_url = $2 WHERE title = $1 AND image_url IS NULL", [title, imageUrl])).rowCount;
  }
  if (photos) console.log(`Added photos to ${photos} demo products / categories / banners.`);

  const stores = {
    style: (await c.query("SELECT id FROM stores WHERE slug='demo-style-corner'")).rows[0],
    tech: (await c.query("SELECT id FROM stores WHERE slug='demo-tech-hub'")).rows[0],
  };
  const cats = {}; // category name -> { id, subs: { subcategory name -> id } }
  for (const r of (await c.query("SELECT c.id, c.name, s.id AS sid, s.name AS sname FROM categories c LEFT JOIN subcategories s ON s.category_id = c.id")).rows) {
    cats[r.name] ??= { id: r.id, subs: {} };
    if (r.sid) cats[r.name].subs[r.sname] = r.sid;
  }

  // Variations live in their own tables; replace_product_variations (from the migrations) loads them from the JSON shape below
  // and a trigger sets the listing's stock and cheapest price from the variants.
  const addProduct = async ({ slug, store, category, subcategory = null, title, price, quantity, brand = "TestBrand", description, tags, images, variations = null }) => {
    const cat = cats[category];
    const { rows } = await c.query(
      `INSERT INTO products (slug, store_id, category_id, subcategory_id, title, price, quantity, brand, description, handling_days_min, handling_days_max, delivery_days_min, delivery_days_max, delivery_fee, free_delivery, payment_methods, location, tags, images, condition)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,1,2,3,5,200,false,'{cod,bank_transfer}','Colombo',$10,$11,'New') RETURNING id`,
      [slug, store.id, cat.id, subcategory ? cat.subs[subcategory] : null, title, price, quantity, brand, description, tags, JSON.stringify(images)],
    );
    if (variations) await c.query("SELECT replace_product_variations($1, $2::jsonb)", [rows[0].id, JSON.stringify(variations)]);
  };
  const exists = async (slug) => (await c.query("SELECT 1 FROM products WHERE slug = $1", [slug])).rowCount > 0;
  const added = [];

  // Two variation products. The slugs keep their original names (they are what the "already added" checks look for).
  if (!(await exists("test-variation-tee"))) {
    await addProduct({
      slug: "test-variation-tee", store: stores.style, category: "Fashion", subcategory: "Shoes", title: "Variation Sneakers", price: 9900, quantity: 15,
      description: "Running sneakers in two colours and two sizes (one option is sold out).", tags: ["new"], images: imgs("sneaker1"),
      variations: {
        attributes: [{ name: "Color", options: ["Red", "White"] }, { name: "Size", options: ["40", "42"] }],
        images: { Red: imgs("sneaker1"), White: imgs("sneaker3", "sneaker2") },
        combinations: [
          { id: "var-red-40", values: { Color: "Red", Size: "40" }, quantity: 5, price: 9900 },
          { id: "var-red-42", values: { Color: "Red", Size: "42" }, quantity: 0, price: 10200 }, // sold out
          { id: "var-white-40", values: { Color: "White", Size: "40" }, quantity: 3, price: 10500 },
          { id: "var-white-42", values: { Color: "White", Size: "42" }, quantity: 7, price: 10800 },
        ],
      },
    });
    // The older one-image-per-option shape is still accepted (and stored as a list).
    await addProduct({
      slug: "test-legacy-variation", store: stores.style, category: "Fashion", subcategory: "Shoes", title: "Legacy Variation Sneakers", price: 8900, quantity: 4,
      description: "Uses the old one-image-per-option data shape.", tags: ["new"], images: [],
      variations: {
        attributes: [{ name: "Color", options: ["Tan"] }],
        images: { Tan: img("sneaker2") },
        combinations: [{ id: "var-tan", values: { Color: "Tan" }, quantity: 4, price: 8900 }],
      },
    });
    added.push("2 variation products");
  }

  // A catalogue of real products across all the categories.
  if (!(await exists(CATALOG[0][0]))) {
    for (const [slug, title, category, subcategory, price, quantity, brand, description, tags, images, owner] of CATALOG) {
      await addProduct({ slug, store: stores[owner], category, subcategory, title, price, quantity, brand, description, tags, images });
    }
    added.push(`${CATALOG.length} catalogue products`);
  }

  // 30 on-sale products (for pagination and the sale page): the catalogue again as discounted "Outlet" copies.
  if (!(await exists("test-sale-1"))) {
    for (let i = 1; i <= 30; i++) {
      const [, title, category, subcategory, price, , brand, description, , images, owner] = CATALOG[(i - 1) % CATALOG.length];
      const lap = Math.floor((i - 1) / CATALOG.length);
      await addProduct({
        slug: `test-sale-${i}`, store: stores[owner], category, subcategory, title: lap ? `${title} (Outlet ${lap + 1})` : `${title} (Outlet)`,
        price: Math.round(price * 0.8), quantity: 10, brand, description: `${description} Discounted outlet stock.`, tags: ["sale"], images,
      });
    }
    added.push("30 on-sale products");
  }

  await c.query("COMMIT");
  console.log(added.length ? `Extra test data added: ${added.join(", ")}.` : "Extra test data already present - nothing more to add.");
  console.log("Logins (password Demo@1234): buyers demo_nimal / demo_kasun / demo_sara, sellers demo_techhub / demo_style.");
} catch (err) {
  await c.query("ROLLBACK").catch(() => {});
  throw err;
} finally {
  await c.end();
}
