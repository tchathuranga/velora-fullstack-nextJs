// Fills the database with demo data: categories, banners, site settings, buyers, sellers with stores, products,
// orders, wishlists and feedback.  Usage: npm run db:seed-demo           (add; skipped if already seeded)
//                                         npm run db:seed-demo -- --reset (remove the demo data, then re-add it)
// Everything it creates is identifiable: usernames start with "demo_", order ids with "ORD-DEMO", and
// categories/banners/products/stores are removed with their owners. The real admin account is never touched.
import bcrypt from "bcryptjs";
import pg from "pg";

const { DATABASE_URL } = process.env;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set (expected in .env.local).");
  process.exit(1);
}
const PASSWORD = "Demo@1234";
const reset = process.argv.includes("--reset");

const local = /localhost|127\.0\.0\.1/.test(DATABASE_URL);
const db = new pg.Client({ connectionString: DATABASE_URL, ssl: local ? false : { rejectUnauthorized: false } });
const q = async (text, params = []) => (await db.query(text, params)).rows;
const one = async (text, params = []) => (await q(text, params))[0];

const CATEGORIES = [
  ["Electronics", ["Phones", "Laptops", "Audio"]],
  ["Fashion", ["Men", "Women", "Shoes"]],
  ["Home & Living", ["Kitchen", "Decor"]],
];
const bank = { name: "Demo Seller", accountNumber: "1234567890", bankName: "Demo Bank", branch: "Colombo", contactNumber: "0112345678" };

await db.connect();
try {
  await q("BEGIN");

  if (reset) {
    await q("DELETE FROM orders WHERE id LIKE 'ORD-DEMO%'");
    await q("DELETE FROM users WHERE username LIKE 'demo\\_%'"); // cascades stores, products, wishlist, feedback, conversations
    await q("DELETE FROM categories WHERE slug IN (SELECT slug FROM categories WHERE name = ANY($1))", [CATEGORIES.map((c) => c[0])]);
    await q("DELETE FROM banners WHERE title LIKE '[Demo]%'");
    console.log("Demo data removed.");
  } else if (await one("SELECT 1 FROM users WHERE username LIKE 'demo\\_%'")) {
    console.log("Demo data already present. Use `npm run db:seed-demo -- --reset` to rebuild it.");
    await q("ROLLBACK");
    process.exit(0);
  }

  const hash = await bcrypt.hash(PASSWORD, 10);

  // Categories
  const subs = {};
  for (const [i, [name, children]] of CATEGORIES.entries()) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const cat = await one(
      `INSERT INTO categories (name, slug, position) VALUES ($1, $2, $3)
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
      [name, slug, i],
    );
    for (const [j, child] of children.entries()) {
      const sub = await one(
        `INSERT INTO subcategories (category_id, name, slug, position) VALUES ($1, $2, $3, $4)
         ON CONFLICT (category_id, slug) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
        [cat.id, child, child.toLowerCase().replace(/[^a-z0-9]+/g, "-"), j],
      );
      subs[child] = { categoryId: cat.id, subcategoryId: sub.id };
    }
  }

  // Banners + site settings
  await q("INSERT INTO banners (title, subtitle, position) VALUES ($1, $2, 0), ($3, $4, 1)", [
    "[Demo] Mega Sale", "Up to 40% off electronics", "[Demo] New Arrivals", "Fresh fashion for the season",
  ]);
  await q(
    `INSERT INTO site_settings (key, value) VALUES ('siteContact', $1), ('adminBankAccounts', $2)
     ON CONFLICT (key) DO NOTHING`,
    [
      JSON.stringify({ email: "support@demo.won.lk", phone: "0112223344", whatsapp: "0771234567" }),
      JSON.stringify([{ label: "Main", bankName: "Demo Bank", accountName: "Won LK", accountNumber: "9876543210", branch: "Colombo" }]),
    ],
  );

  // Users
  const mkUser = (username, name) =>
    one("INSERT INTO users (username, email, name, password_hash) VALUES ($1, $2, $3, $4) RETURNING id", [
      username, `${username}@demo.won.lk`, name, hash,
    ]);
  const buyers = [await mkUser("demo_nimal", "Nimal Perera"), await mkUser("demo_kasun", "Kasun Silva"), await mkUser("demo_sara", "Sara Fernando")];
  const sellerUsers = [await mkUser("demo_techhub", "Tech Hub Owner"), await mkUser("demo_style", "Style Corner Owner"), await mkUser("demo_pending", "New Seller")];

  // Stores
  const mkStore = (owner, slug, name, status, color) =>
    one(
      `INSERT INTO stores (slug, owner_id, store_name, business_name, full_name, address, telephone, email, about_store, status, bank_details, cover_color, profile_color)
       VALUES ($1, $2, $3, $3, 'Demo Owner', '12 Galle Road, Colombo', '0112345678', $4, $5, $6, $7, $8, $9) RETURNING id`,
      [slug, owner.id, name, `${slug}@demo.won.lk`, `${name}: demo store with sample products.`, status, JSON.stringify(bank), color[0], color[1]],
    );
  const tech = await mkStore(sellerUsers[0], "demo-tech-hub", "Tech Hub", "active", ["from-sky-500 to-indigo-600", "bg-sky-600"]);
  const style = await mkStore(sellerUsers[1], "demo-style-corner", "Style Corner", "active", ["from-rose-500 to-orange-500", "bg-rose-600"]);
  await mkStore(sellerUsers[2], "demo-new-seller", "New Seller Shop", "under_review", ["from-indigo-500 to-violet-600", "bg-indigo-600"]);

  // Products
  const PRODUCTS = [
    [tech, "Phones", "Galaxy-style Smartphone 128GB", 89900, 25, "Brand X", 0, true],
    [tech, "Phones", "Budget Android Phone 64GB", 42500, 40, "Brand Y", 350, false],
    [tech, "Laptops", "14-inch Ultrabook i5 16GB", 215000, 8, "Brand Z", 0, true],
    [tech, "Audio", "Wireless Earbuds Pro", 12900, 60, "SoundCo", 250, false],
    [style, "Men", "Classic Cotton Shirt", 3490, 100, "Urban", 300, false],
    [style, "Women", "Floral Summer Dress", 5990, 45, "Bloom", 300, false],
    [style, "Shoes", "Running Sneakers", 8990, 30, "Stride", 0, true],
    [style, "Women", "Leather Handbag", 11500, 15, "Bloom", 350, false],
  ];
  const products = [];
  for (const [store, sub, title, price, quantity, brand, fee, free] of PRODUCTS) {
    const slug = `demo-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;
    products.push(
      await one(
        `INSERT INTO products (slug, store_id, category_id, subcategory_id, title, price, quantity, brand, description,
                              handling_time, delivery_time, delivery_fee, free_delivery, payment_methods, location, tags)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, '1-2 days', '3-5 days', $10, $11, '{cod,bank_transfer}', 'Colombo', $12)
         RETURNING id, store_id, title, price, delivery_fee, free_delivery`,
        [slug, store.id, subs[sub].categoryId, subs[sub].subcategoryId, title, price, quantity, brand, `${title} — demo listing.`, fee, free, ["demo", sub.toLowerCase()]],
      ),
    );
  }

  // Orders (placed the same way the API does: items, seller transactions, stock decrement)
  const ORDERS = [
    ["ORD-DEMO0001", buyers[0], "cod", "processing", [[0, 1], [3, 2]]],
    ["ORD-DEMO0002", buyers[1], "bank_transfer", "shipped", [[4, 2], [6, 1]]],
    ["ORD-DEMO0003", buyers[0], "cod", "delivered", [[2, 1]]],
    ["ORD-DEMO0004", null, "cod", "processing", [[5, 1]]],
  ];
  for (const [id, buyer, method, status, lines] of ORDERS) {
    const items = lines.map(([i, qty]) => ({ p: products[i], qty }));
    const subtotal = items.reduce((s, { p, qty }) => s + p.price * qty, 0);
    const delivery = items.reduce((s, { p }) => s + (p.free_delivery ? 0 : p.delivery_fee), 0);
    const name = buyer ? (buyer === buyers[0] ? "Nimal Perera" : "Kasun Silva") : "Guest Shopper";
    const billing = { fullName: name, street: "5 Temple Road", city: "Kandy", province: "Central", phone1: "0771112223", phone2: "", zipCode: "20000" };
    const steps = [
      { label: "Order placed", done: true, date: new Date().toISOString().slice(0, 10) },
      { label: "Handed to courier", done: status !== "processing" },
      { label: "Out for delivery", done: status === "delivered" },
      { label: "Delivered", done: status === "delivered" },
    ];
    await q(
      `INSERT INTO orders (id, buyer_id, buyer_name, subtotal, delivery_cost, total, payment_method, billing, status, tracking_steps)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [id, buyer?.id ?? null, name, subtotal, delivery, subtotal + delivery, method, JSON.stringify(billing), status, JSON.stringify(steps)],
    );
    for (const [n, { p, qty }] of items.entries()) {
      const item = await one(
        "INSERT INTO order_items (order_id, product_id, store_id, title, price, quantity, tracking_number) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id",
        [id, p.id, p.store_id, p.title, p.price, qty, status === "processing" ? null : `TRK${id.slice(-4)}${n}`],
      );
      await q(
        `INSERT INTO seller_transactions (id, order_item_id, store_id, product_title, payment_method, amount, confirmed, confirmed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, CASE WHEN $7 THEN now() END)`,
        [`TXN-${id.slice(4)}-${n + 1}`, item.id, p.store_id, p.title, method, p.price * qty, status === "delivered"],
      );
      await q("UPDATE products SET quantity = quantity - $2 WHERE id = $1", [p.id, qty]);
    }
  }

  // Wishlists + feedback
  for (const [b, i] of [[0, 1], [0, 6], [1, 2], [2, 3], [2, 7]]) {
    await q("INSERT INTO wishlist_items (user_id, product_id) VALUES ($1, $2)", [buyers[b].id, products[i].id]);
  }
  for (const [b, i, rating, comment] of [
    [0, 2, 5, "Fast delivery and great laptop."],
    [0, 0, 4, "Good phone for the price."],
    [1, 4, 4, "Nice fabric, fits well."],
  ]) {
    await q("INSERT INTO feedback (product_id, buyer_id, buyer_name, rating, comment) VALUES ($1, $2, $3, $4, $5)", [
      products[i].id, buyers[b].id, b === 0 ? "Nimal Perera" : "Kasun Silva", rating, comment,
    ]);
  }

  await q("COMMIT");
  console.log(`Demo data added: ${CATEGORIES.length} categories, 2 banners, 3 buyers, 3 sellers (2 active stores, 1 pending), ${products.length} products, ${ORDERS.length} orders.`);
  console.log(`Log in as demo_nimal / demo_kasun / demo_sara (buyers) or demo_techhub / demo_style (sellers) with password ${PASSWORD}`);
} catch (err) {
  await q("ROLLBACK").catch(() => {});
  throw err;
} finally {
  await db.end();
}
