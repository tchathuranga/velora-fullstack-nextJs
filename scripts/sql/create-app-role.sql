-- A least-privilege database role for the running application.
--
-- Why: the app currently connects as the database owner, which can drop tables and change the schema. The app only needs to
-- read and write rows. With this role the web server cannot alter the schema, and a leaked connection string can do much less
-- harm. Schema changes keep using the owner (DATABASE_URL for `npm run db:reset`); the running site uses this role.
--
-- NOT applied automatically and NOT tested against your Render database - it needs a user allowed to CREATE ROLE. Review it,
-- run it once as the database owner (psql "$OWNER_URL" -f scripts/sql/create-app-role.sql), then point the site's
-- DATABASE_URL at the new role. Replace the password and the database name first.

-- 1. The role: can log in, nothing else.
CREATE ROLE velora_app LOGIN PASSWORD 'CHANGE-ME-to-a-long-random-password'
  NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT;

-- 2. Let it connect and use the public schema (but not create objects in it).
GRANT CONNECT ON DATABASE won_lk_db TO velora_app;                      -- <- your database name
GRANT USAGE ON SCHEMA public TO velora_app;

-- 3. Row access on every existing table and sequence ...
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO velora_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO velora_app;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO velora_app;

-- 4. ... and on the ones future migrations create (these apply to objects created by the role running this script).
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO velora_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO velora_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO velora_app;

-- 5. The audit trail is not the app's to edit.
REVOKE UPDATE, DELETE ON audit_log FROM velora_app;
REVOKE UPDATE, DELETE ON audit_log FROM velora_app;   -- append-only for the app (it can still INSERT)

-- To undo:  REASSIGN OWNED BY velora_app TO CURRENT_USER; DROP OWNED BY velora_app; DROP ROLE velora_app;
