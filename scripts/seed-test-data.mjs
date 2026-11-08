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
// images per colour, one sold-out option; one in the legacy one-image shape) and 30 on-sale products.
//
// Everything is identifiable so "off" can find it: usernames start with "demo_", order ids with "ORD-DEMO", product slugs
// with "demo-" / "test-", banner titles with "[Demo]". Real accounts, stores, orders and categories are never touched, and
// a category is only removed if no remaining product uses it.
import { spawnSync } from "node:child_process";
import pg from "pg";
import { sslFor } from "./lib/pg-ssl.mjs";

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
  if ((await c.query("SELECT 1 FROM products WHERE slug = 'test-variation-tee'")).rowCount) {
    console.log("Extra test data already present - nothing more to add.");
    process.exit(0);
  }
  await c.query("BEGIN");

  let pos = 10;
  for (const name of EXTRA_CATEGORIES) {
    await c.query("INSERT INTO categories (name, slug, position) VALUES ($1,$2,$3) ON CONFLICT (slug) DO NOTHING", [name, slugOf(name), pos++]);
  }

  const svg = (color, label) =>
    "data:image/svg+xml;utf8," +
    encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'><rect width='400' height='400' fill='${color}'/><text x='200' y='210' font-size='40' text-anchor='middle' fill='white'>${label}</text></svg>`);
  const store = (await c.query("SELECT id FROM stores WHERE slug='demo-style-corner'")).rows[0];
  const cat = (await c.query("SELECT c.id cid, s.id sid FROM categories c JOIN subcategories s ON s.category_id=c.id WHERE s.name='Men'")).rows[0];
  const base = [store.id, cat.cid, cat.sid];
  // Variations live in their own tables; replace_product_variations (from the migrations) loads them from the JSON shape below
  // and a trigger sets the listing's stock and cheapest price from the variants.
  const addProduct = async (slug, title, price, quantity, description, tags, images, variations) => {
    const { rows } = await c.query(
      `INSERT INTO products (slug, store_id, category_id, subcategory_id, title, price, quantity, brand, description, handling_days_min, handling_days_max, delivery_days_min, delivery_days_max, delivery_fee, free_delivery, payment_methods, location, tags, images, condition)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'TestBrand',$8,1,2,3,5,200,false,'{cod,bank_transfer}','Colombo',$9,$10,'New') RETURNING id`,
      [slug, ...base, title, price, quantity, description, tags, JSON.stringify(images)],
    );
    if (variations) await c.query("SELECT replace_product_variations($1, $2::jsonb)", [rows[0].id, JSON.stringify(variations)]);
  };

  await addProduct("test-variation-tee", "Variation Tee", 2500, 15, "T-shirt in two colours and two sizes", ["new"], [svg("#64748b", "MAIN")], {
    attributes: [{ name: "Color", options: ["Red", "Blue"] }, { name: "Size", options: ["S", "M"] }],
    images: { Red: [svg("#dc2626", "RED 1"), svg("#b91c1c", "RED 2")], Blue: [svg("#2563eb", "BLUE 1"), svg("#1d4ed8", "BLUE 2"), svg("#1e40af", "BLUE 3")] },
    combinations: [
      { id: "var-red-s", values: { Color: "Red", Size: "S" }, quantity: 5, price: 2500 },
      { id: "var-red-m", values: { Color: "Red", Size: "M" }, quantity: 0, price: 2600 }, // sold out
      { id: "var-blue-s", values: { Color: "Blue", Size: "S" }, quantity: 3, price: 2700 },
      { id: "var-blue-m", values: { Color: "Blue", Size: "M" }, quantity: 7, price: 2800 },
    ],
  });
  // The older one-image-per-option shape is still accepted (and stored as a list).
  await addProduct("test-legacy-variation", "Legacy Variation Hat", 900, 4, "Uses the old one-image-per-option data shape", ["new"], [], {
    attributes: [{ name: "Color", options: ["Green"] }],
    images: { Green: svg("#16a34a", "LEGACY") },
    combinations: [{ id: "var-green", values: { Color: "Green" }, quantity: 4, price: 900 }],
  });
  for (let i = 1; i <= 30; i++) {
    await addProduct(`test-sale-${i}`, `Sale Item ${String(i).padStart(2, "0")}`, 1000 + i, 10, "On sale item", ["sale"], [], null);
  }
  await c.query("COMMIT");
  console.log("Extra test data added: 4 categories, 2 variation products, 30 on-sale products.");
  console.log("Logins (password Demo@1234): buyers demo_nimal / demo_kasun / demo_sara, sellers demo_techhub / demo_style.");
} catch (err) {
  await c.query("ROLLBACK").catch(() => {});
  throw err;
} finally {
  await c.end();
}
