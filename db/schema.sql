-- Velora database schema (final state). Apply with: npm run db:reset

-- ── from 1731000000000_baseline.sql ──
-- Baseline: the schema as it was before migrations were introduced (formerly db/schema.sql).
-- Fully idempotent, so it is safe on a database that already has these tables.

-- won.lk marketplace schema (PostgreSQL). Idempotent: safe to run repeatedly via `npm run db:migrate`.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ───────────────────────── Accounts ─────────────────────────
-- A "seller" is a user that owns an approved store; sellers are not a separate account type.
CREATE TABLE IF NOT EXISTS users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username      text NOT NULL,
  email         text NOT NULL,
  name          text NOT NULL,
  password_hash text NOT NULL,
  role          text NOT NULL DEFAULT 'buyer' CHECK (role IN ('buyer', 'admin')),
  status        text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'limited')),
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS users_username_key ON users (lower(username));
CREATE UNIQUE INDEX IF NOT EXISTS users_email_key ON users (lower(email));

CREATE TABLE IF NOT EXISTS user_addresses (
  user_id    uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  full_name  text NOT NULL,
  street     text NOT NULL,
  city       text NOT NULL,
  province   text NOT NULL,
  phone1     text NOT NULL,
  phone2     text NOT NULL DEFAULT '',
  zip_code   text NOT NULL,
  email      text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ───────────────────────── Stores ─────────────────────────
CREATE TABLE IF NOT EXISTS stores (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                  text NOT NULL UNIQUE,
  owner_id              uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  store_name            text NOT NULL,
  business_name         text NOT NULL,
  full_name             text NOT NULL,
  address               text NOT NULL,
  telephone             text NOT NULL,
  email                 text NOT NULL,
  about_store           text NOT NULL DEFAULT '',
  status                text NOT NULL DEFAULT 'under_review'
                        CHECK (status IN ('active', 'rejected', 'limited', 'under_review')),
  bank_details          jsonb NOT NULL,
  bank_details_optional jsonb,
  cover_color           text NOT NULL DEFAULT 'from-indigo-500 to-violet-600',
  profile_color         text NOT NULL DEFAULT 'bg-indigo-600',
  created_at            timestamptz NOT NULL DEFAULT now()
);

-- Profile pictures / cover photos live in Cloudinary; only their URLs are stored.
ALTER TABLE users  ADD COLUMN IF NOT EXISTS avatar_url        text;
ALTER TABLE users  ADD COLUMN IF NOT EXISTS cover_url         text;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS profile_image_url text;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS cover_image_url   text;

-- ───────────────────────── Catalog ─────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name     text NOT NULL,
  slug     text NOT NULL UNIQUE,
  position integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS subcategories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name        text NOT NULL,
  slug        text NOT NULL,
  position    integer NOT NULL DEFAULT 0,
  UNIQUE (category_id, slug)
);

CREATE TABLE IF NOT EXISTS banners (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title     text NOT NULL,
  subtitle  text NOT NULL DEFAULT '',
  image_url text,
  position  integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS products (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            text NOT NULL UNIQUE,
  store_id        uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  category_id     uuid REFERENCES categories(id) ON DELETE SET NULL,
  subcategory_id  uuid REFERENCES subcategories(id) ON DELETE SET NULL,
  title           text NOT NULL,
  price           numeric(12,2) NOT NULL CHECK (price >= 0),
  quantity        integer NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  brand           text,
  size            text,
  color           text,
  package_include text,
  custom_specs    jsonb NOT NULL DEFAULT '[]'::jsonb,
  description     text NOT NULL DEFAULT '',
  handling_time   text NOT NULL DEFAULT '',
  delivery_time   text NOT NULL DEFAULT '',
  delivery_fee    numeric(12,2) NOT NULL DEFAULT 0 CHECK (delivery_fee >= 0),
  free_delivery   boolean NOT NULL DEFAULT false,
  payment_methods text[] NOT NULL DEFAULT '{}',
  location        text NOT NULL DEFAULT '',
  icon            text NOT NULL DEFAULT '',
  images          jsonb NOT NULL DEFAULT '[]'::jsonb,
  tags            text[] NOT NULL DEFAULT '{}',
  variations      jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS products_store_idx ON products (store_id);
CREATE INDEX IF NOT EXISTS products_category_idx ON products (category_id, subcategory_id);
CREATE INDEX IF NOT EXISTS products_created_idx ON products (created_at DESC);

-- ───────────────────────── Orders & payments ─────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id             text PRIMARY KEY,
  buyer_id       uuid REFERENCES users(id) ON DELETE SET NULL, -- NULL = guest checkout
  buyer_name     text NOT NULL,
  subtotal       numeric(12,2) NOT NULL,
  delivery_cost  numeric(12,2) NOT NULL,
  total          numeric(12,2) NOT NULL,
  payment_method text NOT NULL CHECK (payment_method IN ('cod', 'bank_transfer')),
  billing        jsonb NOT NULL,
  order_note     text NOT NULL DEFAULT '',
  save_address   boolean NOT NULL DEFAULT false,
  status         text NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'shipped', 'delivered')),
  tracking_steps jsonb NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS orders_buyer_idx ON orders (buyer_id, created_at DESC);

CREATE TABLE IF NOT EXISTS order_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        text NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id      uuid REFERENCES products(id) ON DELETE SET NULL,
  store_id        uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  title           text NOT NULL,
  price           numeric(12,2) NOT NULL,
  quantity        integer NOT NULL CHECK (quantity > 0),
  icon            text NOT NULL DEFAULT '',
  variation       jsonb,
  tracking_number text,
  UNIQUE (order_id, product_id)
);
CREATE INDEX IF NOT EXISTS order_items_store_idx ON order_items (store_id);
CREATE INDEX IF NOT EXISTS order_items_product_idx ON order_items (product_id);

-- One payment line per sold item; admins confirm receipt, then pay the seller out.
CREATE TABLE IF NOT EXISTS seller_transactions (
  id             text PRIMARY KEY,
  order_item_id  uuid NOT NULL UNIQUE REFERENCES order_items(id) ON DELETE CASCADE,
  store_id       uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  product_title  text NOT NULL,
  payment_method text NOT NULL CHECK (payment_method IN ('cod', 'bank_transfer')),
  amount         numeric(12,2) NOT NULL,
  confirmed      boolean NOT NULL DEFAULT false,
  confirmed_at   timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS seller_transactions_store_idx ON seller_transactions (store_id, created_at DESC);

CREATE TABLE IF NOT EXISTS seller_payouts (
  id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  amount   numeric(12,2) NOT NULL CHECK (amount > 0),
  paid_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS seller_payouts_store_idx ON seller_payouts (store_id);

-- ───────────────────────── Engagement ─────────────────────────
CREATE TABLE IF NOT EXISTS wishlist_items (
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, product_id)
);

CREATE TABLE IF NOT EXISTS feedback (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  buyer_id   uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  buyer_name text NOT NULL,
  rating     integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment    text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, buyer_id)
);
CREATE INDEX IF NOT EXISTS feedback_product_idx ON feedback (product_id, created_at DESC);

CREATE TABLE IF NOT EXISTS conversations (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id   uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  store_id   uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (buyer_id, store_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender          text NOT NULL CHECK (sender IN ('buyer', 'seller')),
  text            text NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS messages_conversation_idx ON messages (conversation_id, created_at);

-- ───────────────────────── Site configuration ─────────────────────────
-- key 'siteContact'       → { email, phone, whatsapp }
-- key 'adminBankAccounts' → [{ label, bankName, accountName, accountNumber, branch }]
CREATE TABLE IF NOT EXISTS site_settings (
  key   text PRIMARY KEY,
  value jsonb NOT NULL
);

-- ───────────────────────── v2 additions ─────────────────────────
-- Listings: ending a listing moves it to "Unsold"; running out of stock never does.
ALTER TABLE products ADD COLUMN IF NOT EXISTS status             text NOT NULL DEFAULT 'active';
ALTER TABLE products ADD COLUMN IF NOT EXISTS condition          text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS extra_delivery_fee numeric(12,2) NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS returns_accepted   boolean NOT NULL DEFAULT false;
DO $$ BEGIN
  ALTER TABLE products ADD CONSTRAINT products_status_check CHECK (status IN ('active', 'ended'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS products_status_idx ON products (store_id, status);

-- Orders: short sequential ids (ORD-10001), per-line shipping, variation, courier and ship-by deadline.
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 10001;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variation_id  text;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS shipping_cost numeric(12,2) NOT NULL DEFAULT 0;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS courier_name  text;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS ship_by       date;
ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_order_id_product_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS order_items_line_key ON order_items (order_id, product_id, COALESCE(variation_id, ''));

-- Messages can carry photos and point at the listing / order they are about.
ALTER TABLE messages ADD COLUMN IF NOT EXISTS images     jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS product_id uuid REFERENCES products(id) ON DELETE SET NULL;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS order_id   text REFERENCES orders(id) ON DELETE SET NULL;
ALTER TABLE messages ALTER COLUMN text SET DEFAULT '';

-- Reviews show the reviewer's unique username, never their full name.
UPDATE feedback f SET buyer_name = u.username FROM users u WHERE u.id = f.buyer_id AND f.buyer_name <> u.username;

-- Bell-icon notifications for buyers and sellers.
CREATE TABLE IF NOT EXISTS notifications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       text NOT NULL CHECK (type IN ('message', 'order')),
  title      text NOT NULL,
  body       text NOT NULL DEFAULT '',
  link       text NOT NULL DEFAULT '',
  read_at    timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notifications_user_idx ON notifications (user_id, created_at DESC);


-- ── from 1731000100000_phase1-integrity-and-indexes.sql ──
-- Phase 1 of the database redesign: integrity, safety and indexes. No application-visible behaviour changes except that
-- an account/store that has order history can no longer be hard-deleted (the API now answers 409 instead).

-- ── 1. Financial history must outlive its seller: block deletes instead of cascading ─────────────────────────────────
-- Before: deleting a user -> its store -> cascaded away every order line, payment record and payout.
ALTER TABLE order_items         DROP CONSTRAINT IF EXISTS order_items_store_id_fkey;
ALTER TABLE order_items         ADD  CONSTRAINT order_items_store_id_fkey
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE RESTRICT;

ALTER TABLE seller_transactions DROP CONSTRAINT IF EXISTS seller_transactions_store_id_fkey;
ALTER TABLE seller_transactions ADD  CONSTRAINT seller_transactions_store_id_fkey
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE RESTRICT;

ALTER TABLE seller_payouts      DROP CONSTRAINT IF EXISTS seller_payouts_store_id_fkey;
ALTER TABLE seller_payouts      ADD  CONSTRAINT seller_payouts_store_id_fkey
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE RESTRICT;

-- ── 2. Money and quantity rules enforced by the database, not just the app ───────────────────────────────────────────
-- Added NOT VALID then validated, so an existing row that breaks a rule makes the whole migration fail and roll back.
ALTER TABLE orders ADD CONSTRAINT orders_amounts_check
  CHECK (subtotal >= 0 AND delivery_cost >= 0 AND total = subtotal + delivery_cost) NOT VALID;
ALTER TABLE orders VALIDATE CONSTRAINT orders_amounts_check;

ALTER TABLE order_items ADD CONSTRAINT order_items_amounts_check CHECK (price >= 0 AND shipping_cost >= 0) NOT VALID;
ALTER TABLE order_items VALIDATE CONSTRAINT order_items_amounts_check;

ALTER TABLE seller_transactions ADD CONSTRAINT seller_transactions_amount_check CHECK (amount >= 0) NOT VALID;
ALTER TABLE seller_transactions VALIDATE CONSTRAINT seller_transactions_amount_check;

ALTER TABLE products ADD CONSTRAINT products_extra_delivery_fee_check CHECK (extra_delivery_fee >= 0) NOT VALID;
ALTER TABLE products VALIDATE CONSTRAINT products_extra_delivery_fee_check;

-- ── 3. A product's subcategory must belong to its category ───────────────────────────────────────────────────────────
-- (Deleting a subcategory still just clears products.subcategory_id, as before.)
ALTER TABLE subcategories ADD CONSTRAINT subcategories_category_id_id_key UNIQUE (category_id, id);
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_subcategory_id_fkey;
ALTER TABLE products ADD CONSTRAINT products_category_subcategory_fkey
  FOREIGN KEY (category_id, subcategory_id) REFERENCES subcategories (category_id, id) ON DELETE SET NULL (subcategory_id);

-- ── 4. updated_at on the tables that change after creation, maintained by a trigger ──────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger LANGUAGE plpgsql AS $fn$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END
$fn$;

DO $do$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['users', 'stores', 'products', 'orders', 'order_items'] LOOP
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now()', t);
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I', t || '_set_updated_at', t);
    EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at()', t || '_set_updated_at', t);
  END LOOP;
END
$do$;

-- ── 5. Indexes for foreign keys and queries that were missing one ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS wishlist_items_product_idx    ON wishlist_items (product_id);
CREATE INDEX IF NOT EXISTS feedback_buyer_idx            ON feedback (buyer_id);
CREATE INDEX IF NOT EXISTS conversations_store_idx       ON conversations (store_id);
CREATE INDEX IF NOT EXISTS messages_product_idx          ON messages (product_id) WHERE product_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS messages_order_idx            ON messages (order_id) WHERE order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS orders_created_idx            ON orders (created_at DESC);
CREATE INDEX IF NOT EXISTS stores_status_idx             ON stores (status);
CREATE INDEX IF NOT EXISTS products_active_created_idx   ON products (created_at DESC) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS products_tags_idx             ON products USING gin (tags);
CREATE INDEX IF NOT EXISTS notifications_unread_idx      ON notifications (user_id) WHERE read_at IS NULL;

-- ── 6. One place to tell buyers, sellers and admins apart ────────────────────────────────────────────────────────────
-- SELECT * FROM user_accounts WHERE account_type = 'buyer';   (never exposes password_hash)
CREATE OR REPLACE VIEW user_accounts AS
SELECT u.id, u.username, u.email, u.name, u.role, u.status, u.avatar_url, u.cover_url, u.created_at, u.updated_at,
       CASE
         WHEN u.role = 'admin'    THEN 'admin'
         WHEN s.status = 'active' THEN 'seller'
         WHEN s.id IS NOT NULL    THEN 'seller_pending'   -- applied, under review, rejected or limited
         ELSE 'buyer'
       END AS account_type,
       s.id     AS store_id,
       s.status AS store_status
FROM users u
LEFT JOIN stores s ON s.owner_id = u.id;


-- ── from 1731000200000_phase2-variation-tables.sql ──
-- Phase 2 of the database redesign: product variations move out of the products.variations JSON blob into real tables.
--
--   product_variation_attributes   e.g. "Color", "Size"                    (per product, ordered)
--   product_variation_options      e.g. "Red", "Blue"                      (per attribute, ordered)
--   product_variation_option_images  photos shown when that option is chosen
--   product_variants               one purchasable combination: price + stock, CHECK (quantity >= 0)
--   product_variant_options        which option each variant has for each attribute
--
-- products.quantity / products.price stay as the listing's headline stock and cheapest price, but a trigger now derives them
-- from the variants, so they can no longer drift. order_items.variation_id stays a plain text reference (no foreign key) on
-- purpose: order lines are historical snapshots and must survive a seller restructuring or removing a variation.

CREATE TABLE product_variation_attributes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name       text NOT NULL,
  position   integer NOT NULL DEFAULT 0,
  UNIQUE (product_id, name)
);

CREATE TABLE product_variation_options (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attribute_id uuid NOT NULL REFERENCES product_variation_attributes(id) ON DELETE CASCADE,
  value        text NOT NULL,
  position     integer NOT NULL DEFAULT 0,
  UNIQUE (attribute_id, value),
  UNIQUE (attribute_id, id)
);

CREATE TABLE product_variation_option_images (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  option_id uuid NOT NULL REFERENCES product_variation_options(id) ON DELETE CASCADE,
  url       text NOT NULL,
  position  integer NOT NULL DEFAULT 0
);
CREATE INDEX product_variation_option_images_option_idx ON product_variation_option_images (option_id, position);

CREATE TABLE product_variants (
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  id         text NOT NULL,                       -- the stable id the storefront and order lines refer to
  price      numeric(12,2) NOT NULL CHECK (price >= 0),
  quantity   integer NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  position   integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (product_id, id)
);
CREATE TRIGGER product_variants_set_updated_at BEFORE UPDATE ON product_variants FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE product_variant_options (
  product_id   uuid NOT NULL,
  variant_id   text NOT NULL,
  attribute_id uuid NOT NULL,
  option_id    uuid NOT NULL,
  PRIMARY KEY (product_id, variant_id, attribute_id),             -- exactly one option per attribute
  FOREIGN KEY (product_id, variant_id) REFERENCES product_variants (product_id, id) ON DELETE CASCADE,
  FOREIGN KEY (attribute_id, option_id) REFERENCES product_variation_options (attribute_id, id) ON DELETE CASCADE
);
CREATE INDEX product_variant_options_option_idx ON product_variant_options (option_id);

-- ── Derived listing stock and price ──────────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION sync_product_from_variants() RETURNS trigger LANGUAGE plpgsql AS $fn$
DECLARE pid uuid := COALESCE(NEW.product_id, OLD.product_id);
BEGIN
  UPDATE products p SET quantity = v.total, price = v.cheapest
    FROM (SELECT sum(quantity)::integer AS total, min(price) AS cheapest
            FROM product_variants WHERE product_id = pid HAVING count(*) > 0) v
   WHERE p.id = pid AND (p.quantity IS DISTINCT FROM v.total OR p.price IS DISTINCT FROM v.cheapest);
  RETURN NULL;
END
$fn$;
CREATE TRIGGER product_variants_sync_product AFTER INSERT OR UPDATE OR DELETE ON product_variants
  FOR EACH ROW EXECUTE FUNCTION sync_product_from_variants();

-- ── Read: the same JSON shape the API has always served ──────────────────────────────────────────────────────────────
--   { attributes: [{name, options[]}], images: { optionValue: [url...] }, combinations: [{id, values, price, quantity}] }
-- NULL when the product has no variants.
CREATE OR REPLACE FUNCTION product_variations_json(pid uuid) RETURNS jsonb LANGUAGE sql STABLE AS $fn$
  SELECT CASE WHEN NOT EXISTS (SELECT 1 FROM product_variants WHERE product_id = pid) THEN NULL ELSE jsonb_build_object(
    'attributes', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('name', a.name, 'options', COALESCE((
               SELECT jsonb_agg(o.value ORDER BY o.position, o.value) FROM product_variation_options o WHERE o.attribute_id = a.id
             ), '[]'::jsonb)) ORDER BY a.position, a.name)
        FROM product_variation_attributes a WHERE a.product_id = pid
    ), '[]'::jsonb),
    'images', COALESCE((
      SELECT jsonb_object_agg(t.value, t.urls) FROM (
        SELECT o.value, jsonb_agg(i.url ORDER BY i.position) AS urls
          FROM product_variation_options o
          JOIN product_variation_attributes a ON a.id = o.attribute_id AND a.product_id = pid
          JOIN product_variation_option_images i ON i.option_id = o.id
         GROUP BY o.value) t
    ), '{}'::jsonb),
    'combinations', (
      SELECT jsonb_agg(jsonb_build_object(
               'id', v.id, 'price', v.price, 'quantity', v.quantity,
               'values', COALESCE((
                  SELECT jsonb_object_agg(a.name, o.value)
                    FROM product_variant_options vo
                    JOIN product_variation_attributes a ON a.id = vo.attribute_id
                    JOIN product_variation_options o ON o.id = vo.option_id
                   WHERE vo.product_id = v.product_id AND vo.variant_id = v.id
               ), '{}'::jsonb)) ORDER BY v.position, v.id)
        FROM product_variants v WHERE v.product_id = pid
    )
  ) END
$fn$;

-- ── Write: replace a product's variations from that JSON shape, updating in place ────────────────────────────────────
-- Variants are matched by id, so a variant that survives an edit keeps its identity (order lines point at it).
-- Used by the API, the backfill below, the seed scripts and the tests - one implementation of the rules.
CREATE OR REPLACE FUNCTION replace_product_variations(pid uuid, v jsonb) RETURNS void LANGUAGE plpgsql AS $fn$
DECLARE
  attr jsonb; combo jsonb; kv record;
  a_pos integer := 0; o_pos integer; v_pos integer := 0;
  attr_id uuid; opt_id uuid;
  attr_names text[] := '{}';
  keep_ids text[];
BEGIN
  IF v IS NULL OR jsonb_typeof(v) <> 'object' OR COALESCE(jsonb_array_length(v->'combinations'), 0) = 0 THEN
    DELETE FROM product_variants WHERE product_id = pid;
    DELETE FROM product_variation_attributes WHERE product_id = pid;
    RETURN;
  END IF;

  -- Variants the seller no longer offers.
  SELECT array_agg(c->>'id') INTO keep_ids FROM jsonb_array_elements(v->'combinations') c;
  DELETE FROM product_variants WHERE product_id = pid AND id <> ALL (keep_ids);

  -- Attributes and their options, in the seller's order.
  FOR attr IN SELECT * FROM jsonb_array_elements(COALESCE(v->'attributes', '[]'::jsonb)) LOOP
    INSERT INTO product_variation_attributes (product_id, name, position) VALUES (pid, attr->>'name', a_pos)
      ON CONFLICT (product_id, name) DO UPDATE SET position = EXCLUDED.position
      RETURNING id INTO attr_id;
    attr_names := attr_names || (attr->>'name');
    o_pos := 0;
    FOR kv IN SELECT jsonb_array_elements_text(COALESCE(attr->'options', '[]'::jsonb)) AS value LOOP
      INSERT INTO product_variation_options (attribute_id, value, position) VALUES (attr_id, kv.value, o_pos)
        ON CONFLICT (attribute_id, value) DO UPDATE SET position = EXCLUDED.position;
      o_pos := o_pos + 1;
    END LOOP;
    DELETE FROM product_variation_options
     WHERE attribute_id = attr_id
       AND value <> ALL (ARRAY(SELECT jsonb_array_elements_text(COALESCE(attr->'options', '[]'::jsonb))));
    a_pos := a_pos + 1;
  END LOOP;
  DELETE FROM product_variation_attributes WHERE product_id = pid AND name <> ALL (attr_names);

  -- Variants: upsert, then rebuild which option each one has.
  FOR combo IN SELECT * FROM jsonb_array_elements(v->'combinations') LOOP
    INSERT INTO product_variants (product_id, id, price, quantity, position)
      VALUES (pid, combo->>'id', (combo->>'price')::numeric, (combo->>'quantity')::integer, v_pos)
      ON CONFLICT (product_id, id) DO UPDATE SET price = EXCLUDED.price, quantity = EXCLUDED.quantity, position = EXCLUDED.position;
    DELETE FROM product_variant_options WHERE product_id = pid AND variant_id = combo->>'id';
    FOR kv IN SELECT key, value FROM jsonb_each_text(COALESCE(combo->'values', '{}'::jsonb)) LOOP
      SELECT id INTO attr_id FROM product_variation_attributes WHERE product_id = pid AND name = kv.key;
      IF attr_id IS NULL THEN   -- tolerate a value that was never declared as an attribute/option
        INSERT INTO product_variation_attributes (product_id, name, position)
          VALUES (pid, kv.key, COALESCE((SELECT max(position) + 1 FROM product_variation_attributes WHERE product_id = pid), 0))
          RETURNING id INTO attr_id;
      END IF;
      SELECT id INTO opt_id FROM product_variation_options WHERE attribute_id = attr_id AND value = kv.value;
      IF opt_id IS NULL THEN
        INSERT INTO product_variation_options (attribute_id, value, position)
          VALUES (attr_id, kv.value, COALESCE((SELECT max(position) + 1 FROM product_variation_options WHERE attribute_id = attr_id), 0))
          RETURNING id INTO opt_id;
      END IF;
      INSERT INTO product_variant_options (product_id, variant_id, attribute_id, option_id) VALUES (pid, combo->>'id', attr_id, opt_id);
    END LOOP;
    v_pos := v_pos + 1;
  END LOOP;

  -- Photos per option value (a single URL string is the older shape; a list is the current one).
  DELETE FROM product_variation_option_images
   WHERE option_id IN (SELECT o.id FROM product_variation_options o
                         JOIN product_variation_attributes a ON a.id = o.attribute_id AND a.product_id = pid);
  FOR kv IN SELECT key, value FROM jsonb_each(COALESCE(v->'images', '{}'::jsonb)) LOOP
    INSERT INTO product_variation_option_images (option_id, url, position)
    SELECT o.id, u.url, u.ord - 1
      FROM product_variation_options o
      JOIN product_variation_attributes a ON a.id = o.attribute_id AND a.product_id = pid
      CROSS JOIN LATERAL jsonb_array_elements_text(
        CASE WHEN jsonb_typeof(kv.value) = 'array' THEN kv.value ELSE jsonb_build_array(kv.value) END
      ) WITH ORDINALITY AS u(url, ord)
     WHERE o.value = kv.key;
  END LOOP;
END
$fn$;

-- ── Backfill from the JSON column, then retire it ────────────────────────────────────────────────────────────────────
DO $do$
DECLARE r record;
BEGIN
  FOR r IN SELECT id, variations FROM products WHERE variations IS NOT NULL LOOP
    PERFORM replace_product_variations(r.id, r.variations);
  END LOOP;
END
$do$;

ALTER TABLE products DROP COLUMN variations;


-- ── from 1731000300000_phase3a-orders-shipping-fees.sql ──
-- Phase 3A of the database redesign: the order side.
--
--   shipments       courier + tracking per order line (was two columns on order_items)
--   order_events    one row per tracking milestone with its date (was the orders.tracking_steps JSON array)
--   fee snapshot    seller_transactions records the commission rate and amount charged at the time of sale
--   payout link     seller_transactions.payout_id says which payout settled a payment
--   billing_*       the delivery address as real columns on orders (was the orders.billing JSON blob)
--
-- The API keeps its response shapes: order_tracking_steps() and the billing columns are turned back into the same JSON.

-- ── 1. shipments ─────────────────────────────────────────────────────────────────────────────────────────────────────
CREATE TABLE shipments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id   uuid NOT NULL UNIQUE REFERENCES order_items(id) ON DELETE CASCADE,
  tracking_number text NOT NULL,
  courier_name    text,                       -- NULL only on legacy rows that were saved before the courier was required
  shipped_at      timestamptz NOT NULL DEFAULT now(),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER shipments_set_updated_at BEFORE UPDATE ON shipments FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- shipped_at: the date the order was handed to the courier when we know it, otherwise when the order was placed.
INSERT INTO shipments (order_item_id, tracking_number, courier_name, shipped_at)
SELECT oi.id, oi.tracking_number, oi.courier_name,
       COALESCE(NULLIF(step.d, '')::timestamptz, o.created_at)
  FROM order_items oi
  JOIN orders o ON o.id = oi.order_id
  LEFT JOIN LATERAL (
    SELECT s->>'date' AS d FROM jsonb_array_elements(o.tracking_steps) s
     WHERE s->>'label' = 'Handed to courier' AND COALESCE((s->>'done')::boolean, false) LIMIT 1
  ) step ON true
 WHERE oi.tracking_number IS NOT NULL;

ALTER TABLE order_items DROP COLUMN tracking_number;
ALTER TABLE order_items DROP COLUMN courier_name;

-- ── 2. order_events ──────────────────────────────────────────────────────────────────────────────────────────────────
CREATE TABLE order_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    text NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  type        text NOT NULL CHECK (type IN ('placed', 'handed_to_courier', 'out_for_delivery', 'delivered')),
  occurred_on date NOT NULL,                  -- the calendar date shown to the buyer (Sri Lanka time)
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (order_id, type)
);

INSERT INTO order_events (order_id, type, occurred_on)
SELECT o.id, m.type, COALESCE(NULLIF(s->>'date', '')::date, o.created_at::date)
  FROM orders o
 CROSS JOIN LATERAL jsonb_array_elements(o.tracking_steps) s
  JOIN (VALUES ('Order placed', 'placed'), ('Handed to courier', 'handed_to_courier'),
               ('Out for delivery', 'out_for_delivery'), ('Delivered', 'delivered')) m(label, type) ON m.label = s->>'label'
 WHERE COALESCE((s->>'done')::boolean, false)
ON CONFLICT (order_id, type) DO NOTHING;

-- Every order was placed.
INSERT INTO order_events (order_id, type, occurred_on)
SELECT o.id, 'placed', o.created_at::date FROM orders o
 WHERE NOT EXISTS (SELECT 1 FROM order_events e WHERE e.order_id = o.id AND e.type = 'placed');

-- The four tracking steps as the API has always served them: [{ label, done, date? }].
CREATE OR REPLACE FUNCTION order_tracking_steps(oid text) RETURNS jsonb LANGUAGE sql STABLE AS $fn$
  SELECT jsonb_agg(
           jsonb_build_object('label', s.label, 'done', e.id IS NOT NULL)
           || CASE WHEN e.id IS NOT NULL THEN jsonb_build_object('date', to_char(e.occurred_on, 'YYYY-MM-DD')) ELSE '{}'::jsonb END
           ORDER BY s.ord)
    FROM (VALUES (1, 'placed', 'Order placed'), (2, 'handed_to_courier', 'Handed to courier'),
                 (3, 'out_for_delivery', 'Out for delivery'), (4, 'delivered', 'Delivered')) s(ord, type, label)
    LEFT JOIN order_events e ON e.order_id = oid AND e.type = s.type
$fn$;

-- ── 3. delivery address as real columns ──────────────────────────────────────────────────────────────────────────────
ALTER TABLE orders
  ADD COLUMN billing_full_name text,
  ADD COLUMN billing_street    text,
  ADD COLUMN billing_city      text,
  ADD COLUMN billing_province  text,
  ADD COLUMN billing_phone1    text,
  ADD COLUMN billing_phone2    text NOT NULL DEFAULT '',
  ADD COLUMN billing_zip_code  text,
  ADD COLUMN billing_email     text;

UPDATE orders SET
  billing_full_name = COALESCE(billing->>'fullName', ''),
  billing_street    = COALESCE(billing->>'street', ''),
  billing_city      = COALESCE(billing->>'city', ''),
  billing_province  = COALESCE(billing->>'province', ''),
  billing_phone1    = COALESCE(billing->>'phone1', ''),
  billing_phone2    = COALESCE(billing->>'phone2', ''),
  billing_zip_code  = COALESCE(billing->>'zipCode', ''),
  billing_email     = NULLIF(billing->>'email', '');

ALTER TABLE orders
  ALTER COLUMN billing_full_name SET NOT NULL,
  ALTER COLUMN billing_street    SET NOT NULL,
  ALTER COLUMN billing_city      SET NOT NULL,
  ALTER COLUMN billing_province  SET NOT NULL,
  ALTER COLUMN billing_phone1    SET NOT NULL,
  ALTER COLUMN billing_zip_code  SET NOT NULL;

ALTER TABLE orders DROP COLUMN billing;
ALTER TABLE orders DROP COLUMN tracking_steps;

-- ── 4. commission snapshot and payout link on seller transactions ────────────────────────────────────────────────────
ALTER TABLE seller_transactions
  ADD COLUMN fee_rate   numeric(6,4)  NOT NULL DEFAULT 0.03 CHECK (fee_rate >= 0 AND fee_rate < 1),
  ADD COLUMN fee_amount numeric(12,2) NOT NULL DEFAULT 0    CHECK (fee_amount >= 0);
UPDATE seller_transactions SET fee_amount = round(amount * fee_rate, 2);   -- the 3% that applied until now
ALTER TABLE seller_transactions ALTER COLUMN fee_rate DROP DEFAULT;        -- new sales must state the rate they were charged
ALTER TABLE seller_transactions ALTER COLUMN fee_amount DROP DEFAULT;
ALTER TABLE seller_transactions ADD CONSTRAINT seller_transactions_fee_within_amount CHECK (fee_amount <= amount);

-- Which payout settled a payment. Payments paid out before this column existed stay NULL (the payout balance is unchanged).
ALTER TABLE seller_transactions ADD COLUMN payout_id uuid REFERENCES seller_payouts(id) ON DELETE RESTRICT;
CREATE INDEX seller_transactions_payout_idx ON seller_transactions (payout_id) WHERE payout_id IS NOT NULL;


-- ── from 1731000400000_phase3b-addresses-days-sales.sql ──
-- Phase 3B of the database redesign:
--   1. a user can keep several saved addresses (the app still manages one "default" address)
--   2. handling / delivery time become whole numbers of days instead of free text
--   3. real sale pricing (compare_at_price + sale_ends_at), so "On sale" has a source of truth

-- ── 1. several saved addresses per user ──────────────────────────────────────────────────────────────────────────────
ALTER TABLE user_addresses DROP CONSTRAINT user_addresses_pkey;
ALTER TABLE user_addresses ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE user_addresses ADD COLUMN id         uuid    NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE user_addresses ADD PRIMARY KEY (id);
ALTER TABLE user_addresses ADD COLUMN label      text    NOT NULL DEFAULT 'Home';
ALTER TABLE user_addresses ADD COLUMN is_default boolean NOT NULL DEFAULT true;
CREATE UNIQUE INDEX user_addresses_one_default_idx ON user_addresses (user_id) WHERE is_default;   -- one default per user
CREATE INDEX user_addresses_user_idx ON user_addresses (user_id);

-- ── 2. delivery days as numbers ──────────────────────────────────────────────────────────────────────────────────────
-- "2-3 days" -> {2,3}; "3 business days" -> {3,3}; text with no number -> {0,0} (unknown). Same rule the app has always used.
CREATE OR REPLACE FUNCTION parse_day_range(t text) RETURNS integer[] LANGUAGE sql IMMUTABLE AS $fn$
  SELECT CASE WHEN cardinality(n) = 0 THEN ARRAY[0, 0]
              ELSE ARRAY[LEAST(n[1], COALESCE(n[2], n[1])), GREATEST(n[1], COALESCE(n[2], n[1]))] END
    FROM (SELECT ARRAY(SELECT LEAST(m[1]::numeric, 365)::integer FROM regexp_matches(COALESCE(t, ''), '\d+', 'g') AS m) AS n) x
$fn$;

ALTER TABLE products
  ADD COLUMN handling_days_min integer NOT NULL DEFAULT 0,
  ADD COLUMN handling_days_max integer NOT NULL DEFAULT 0,
  ADD COLUMN delivery_days_min integer NOT NULL DEFAULT 0,
  ADD COLUMN delivery_days_max integer NOT NULL DEFAULT 0;

UPDATE products SET
  handling_days_min = (parse_day_range(handling_time))[1],
  handling_days_max = (parse_day_range(handling_time))[2],
  delivery_days_min = (parse_day_range(delivery_time))[1],
  delivery_days_max = (parse_day_range(delivery_time))[2];

ALTER TABLE products
  ADD CONSTRAINT products_handling_days_check CHECK (handling_days_min >= 0 AND handling_days_max >= handling_days_min AND handling_days_max <= 365),
  ADD CONSTRAINT products_delivery_days_check CHECK (delivery_days_min >= 0 AND delivery_days_max >= delivery_days_min AND delivery_days_max <= 365);

ALTER TABLE products DROP COLUMN handling_time;
ALTER TABLE products DROP COLUMN delivery_time;

-- ── 3. sale pricing ──────────────────────────────────────────────────────────────────────────────────────────────────
-- A listing is "on sale" while compare_at_price (the original price) is above its price and the sale has not ended.
-- That is derived when reading, so a sale ends by itself with no job. Whether the original price is above the selling
-- price is checked by the API (the selling price of a listing with variations is derived from its variants).
ALTER TABLE products ADD COLUMN compare_at_price numeric(12,2) CHECK (compare_at_price IS NULL OR compare_at_price > 0);
ALTER TABLE products ADD COLUMN sale_ends_at     timestamptz;
CREATE INDEX products_sale_idx ON products (created_at DESC) WHERE compare_at_price IS NOT NULL;


-- ── from 1731000500000_phase4-counters-audit-bank.sql ──
-- Phase 4 of the database redesign: scale and security.
--   1. stored rating / review / sales counters on products, kept current by triggers (the catalog query no longer runs
--      four subqueries per product row)
--   2. an append-only audit_log for administrator actions
--   3. columns for encrypted bank details (the application encrypts; run `npm run db:bank-details -- encrypt` after migrating)

-- ── 1. product counters ──────────────────────────────────────────────────────────────────────────────────────────────
ALTER TABLE products
  ADD COLUMN rating_avg   numeric(2,1) NOT NULL DEFAULT 0 CHECK (rating_avg BETWEEN 0 AND 5),
  ADD COLUMN review_count integer      NOT NULL DEFAULT 0 CHECK (review_count >= 0),
  ADD COLUMN sold_count   integer      NOT NULL DEFAULT 0 CHECK (sold_count >= 0),
  ADD COLUMN last_sold_at timestamptz;

-- Fill them from what is there now (without touching every product's updated_at).
ALTER TABLE products DISABLE TRIGGER products_set_updated_at;
UPDATE products p SET
  rating_avg   = COALESCE((SELECT round(avg(f.rating), 1) FROM feedback f WHERE f.product_id = p.id), 0),
  review_count = (SELECT count(*) FROM feedback f WHERE f.product_id = p.id),
  sold_count   = COALESCE((SELECT sum(oi.quantity) FROM order_items oi WHERE oi.product_id = p.id), 0),
  last_sold_at = (SELECT max(o.created_at) FROM order_items oi JOIN orders o ON o.id = oi.order_id WHERE oi.product_id = p.id);
ALTER TABLE products ENABLE TRIGGER products_set_updated_at;

CREATE OR REPLACE FUNCTION refresh_product_feedback(pid uuid) RETURNS void LANGUAGE sql AS $fn$
  UPDATE products SET
    rating_avg   = COALESCE((SELECT round(avg(f.rating), 1) FROM feedback f WHERE f.product_id = pid), 0),
    review_count = (SELECT count(*) FROM feedback f WHERE f.product_id = pid)
  WHERE id = pid
$fn$;

CREATE OR REPLACE FUNCTION refresh_product_sales(pid uuid) RETURNS void LANGUAGE sql AS $fn$
  UPDATE products SET
    sold_count   = COALESCE((SELECT sum(oi.quantity) FROM order_items oi WHERE oi.product_id = pid), 0),
    last_sold_at = (SELECT max(o.created_at) FROM order_items oi JOIN orders o ON o.id = oi.order_id WHERE oi.product_id = pid)
  WHERE id = pid
$fn$;

CREATE OR REPLACE FUNCTION feedback_refresh_product() RETURNS trigger LANGUAGE plpgsql AS $fn$
BEGIN
  IF TG_OP IN ('UPDATE', 'DELETE') THEN PERFORM refresh_product_feedback(OLD.product_id); END IF;
  IF TG_OP IN ('INSERT', 'UPDATE') THEN PERFORM refresh_product_feedback(NEW.product_id); END IF;
  RETURN NULL;
END
$fn$;
CREATE TRIGGER feedback_refresh_product AFTER INSERT OR UPDATE OF rating, product_id OR DELETE ON feedback
  FOR EACH ROW EXECUTE FUNCTION feedback_refresh_product();

CREATE OR REPLACE FUNCTION order_items_refresh_product() RETURNS trigger LANGUAGE plpgsql AS $fn$
BEGIN
  IF TG_OP IN ('UPDATE', 'DELETE') AND OLD.product_id IS NOT NULL THEN PERFORM refresh_product_sales(OLD.product_id); END IF;
  IF TG_OP IN ('INSERT', 'UPDATE') AND NEW.product_id IS NOT NULL THEN PERFORM refresh_product_sales(NEW.product_id); END IF;
  RETURN NULL;
END
$fn$;
CREATE TRIGGER order_items_refresh_product AFTER INSERT OR UPDATE OF quantity, product_id OR DELETE ON order_items
  FOR EACH ROW EXECUTE FUNCTION order_items_refresh_product();

CREATE INDEX products_last_sold_idx ON products (last_sold_at DESC) WHERE last_sold_at IS NOT NULL;

-- ── 2. audit log (append-only) ───────────────────────────────────────────────────────────────────────────────────────
CREATE TABLE audit_log (
  id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_id       uuid REFERENCES users(id) ON DELETE SET NULL,
  actor_username text NOT NULL,                       -- kept as written, so the trail survives the account being deleted
  action         text NOT NULL,                       -- e.g. 'store.status_changed', 'payout.created'
  entity_type    text NOT NULL,
  entity_id      text,
  details        jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_log_created_idx ON audit_log (created_at DESC);
CREATE INDEX audit_log_entity_idx  ON audit_log (entity_type, entity_id, created_at DESC);
CREATE INDEX audit_log_actor_idx   ON audit_log (actor_id, created_at DESC) WHERE actor_id IS NOT NULL;

-- Rows can't be edited or removed. The one allowed change is the foreign key clearing actor_id when an account is deleted.
CREATE OR REPLACE FUNCTION audit_log_append_only() RETURNS trigger LANGUAGE plpgsql AS $fn$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'audit_log is append-only';
  END IF;
  IF (to_jsonb(NEW) - 'actor_id') IS DISTINCT FROM (to_jsonb(OLD) - 'actor_id') THEN
    RAISE EXCEPTION 'audit_log is append-only';
  END IF;
  RETURN NEW;
END
$fn$;
CREATE TRIGGER audit_log_append_only BEFORE UPDATE OR DELETE ON audit_log FOR EACH ROW EXECUTE FUNCTION audit_log_append_only();

-- ── 3. encrypted bank details ────────────────────────────────────────────────────────────────────────────────────────
-- Expand step: the application writes the encrypted columns and still reads old plaintext rows until
-- `npm run db:bank-details -- encrypt` has converted them (it then clears the plaintext columns).
ALTER TABLE stores ALTER COLUMN bank_details DROP NOT NULL;
ALTER TABLE stores ADD COLUMN bank_details_enc          text;
ALTER TABLE stores ADD COLUMN bank_details_optional_enc text;
ALTER TABLE stores ADD CONSTRAINT stores_bank_details_present CHECK (bank_details IS NOT NULL OR bank_details_enc IS NOT NULL);

