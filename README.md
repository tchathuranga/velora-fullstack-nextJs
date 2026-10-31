# won.lk — marketplace

Next.js (App Router) storefront + backend for a buyer / seller / admin marketplace.
PostgreSQL via `pg`, Redux Toolkit (RTK Query) on the frontend. See [APPLICATION_FEATURES.md](APPLICATION_FEATURES.md) for the feature list.

## Setup

1. Put these in `.env.local` (git-ignored):

   | Variable | Purpose |
   | --- | --- |
   | `DATABASE_URL` | PostgreSQL connection string |
   | `JWT_SECRET` | Random string, 32+ chars — signs the session cookie |
   | `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_EMAIL` | Used only by `db:seed-admin` (password 8+ chars) |
   | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Image hosting for profile / cover photos, product photos (including photos inside descriptions and variations) and message photos. **Set these in every environment you deploy to** — without them uploads fail with "Image uploads aren't configured yet." |

2. Create the tables and the admin account (both idempotent):

   ```bash
   npm run db:migrate       # applies db/schema.sql
   npm run db:seed-admin    # creates/updates the admin from the ADMIN_* variables
   ```

3. `npm run dev`, then sign in at `/admin/login`.

There is no sample data. Admins create categories and banners; sellers apply at `/sell/register`,
an admin approves them at `/admin/sellers`, and approved sellers list products.
Contact details and the bank accounts shown to bank-transfer buyers live in the `site_settings` table
(`PUT /api/admin/site`); they are empty until an admin sets them.

## Marketplace rules

- **Checkout** requires a signed-in buyer. "Buy it now" checks out one product directly (`/checkout?buy=<slug>`) without touching the cart.
- **Order ids** are sequential: `ORD-10001`, `ORD-10002`, … (Postgres sequence `order_number_seq`), so they can never collide.
- **Shipping** is per listing: first-item fee + additional-item fee × (units − 1); free-shipping listings charge nothing (`src/lib/shipping.ts`, shared by browser and server).
- **Delivery estimate** = purchase date + handling time + delivery time (days are read from the seller's text, e.g. "2-3 days"). The seller's **ship-by** date is the order date + the maximum handling time and is stored on each order line.
- **Listings** are `active` or `ended`. Ending a listing moves it to the seller's *Unsold* section and hides it from buyers; running out of stock does not.
- **Seller earnings** = item price + shipping − 3% website fee of (item price + shipping).
- **Notifications** (bell icon) are stored in `notifications`: sellers are told about new orders and buyer messages, buyers about seller messages and shipped orders.

## Architecture

- **Database** — `db/schema.sql`: users, user_addresses, stores, categories, subcategories, banners, products,
  orders, order_items, seller_transactions, seller_payouts, wishlist_items, feedback, conversations, messages,
  site_settings. A seller is a user who owns an approved store.
- **API** — route handlers under `src/app/api/**`; shared server code in `src/server/` (db pool, session/JWT cookie,
  zod validation, row → API serializers). Prices, delivery fees and stock are always computed server-side at checkout.
  Roles are derived from the database on every request, not stored in the token.
- **Frontend state** — `src/Redux/api.ts` is the single RTK Query API slice (all server data and mutations, with tag
  invalidation). The context hooks in `src/context/` (`useAuth`, `useProducts`, `useStores`, …) are thin wrappers over it.
  Cart and recently-viewed stay client-side (localStorage); the wishlist lives in the database for signed-in users and
  is merged from the browser on login.
