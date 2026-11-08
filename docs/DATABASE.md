# Database

PostgreSQL, accessed with plain `pg` queries from the route handlers. The whole schema lives in one file,
[`db/schema.sql`](../db/schema.sql); there is no migration tooling.

## Commands

```bash
npm run db:reset        # DESTRUCTIVE: drops the public schema, applies db/schema.sql, loads admin + demo + test data
npm run db:seed-admin   # create/update the admin from ADMIN_* in .env.local
npm run db:test-data    # TEST_DATA=on adds / TEST_DATA=off removes the demo + test data (schema must already exist)
npm test                # builds a throwaway schema from db/schema.sql for every run
```

## Changing the schema

Edit `db/schema.sql` and run `npm run db:reset` (development). The reset refuses to run when `NODE_ENV=production`; a
production database with real data needs a hand-written `ALTER` script and a `pg_dump` backup first.

Keep money rules in the database (`CHECK` constraints), e.g. `orders.total = subtotal + delivery_cost`. Seed scripts must
convert `NUMERIC` values with `Number()` because `pg` returns them as strings.
