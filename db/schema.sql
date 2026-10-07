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
