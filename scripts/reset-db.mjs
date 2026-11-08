// Wipes the database and rebuilds it: drops the `public` schema (ALL data), applies db/schema.sql, then loads fresh test data
// (admin account + demo seed + extra test data from seed-test-data.mjs).
//   npm run db:reset
// DESTRUCTIVE. Uses DATABASE_URL from .env.local. Refuses to run when NODE_ENV=production.
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import pg from "pg";
import { sslFor } from "./lib/pg-ssl.mjs";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set (expected in .env.local).");
  process.exit(1);
}
if (process.env.NODE_ENV === "production") {
  console.error("Refusing to reset a database when NODE_ENV=production.");
  process.exit(1);
}

const schema = readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8");
const client = new pg.Client({ connectionString: url, ssl: sslFor(url) });
await client.connect();
try {
  await client.query("BEGIN");
  await client.query("DROP SCHEMA IF EXISTS public CASCADE");
  await client.query("CREATE SCHEMA public");
  await client.query(schema);
  await client.query("COMMIT");
  console.log("Database wiped and schema applied.");
} catch (err) {
  await client.query("ROLLBACK").catch(() => {});
  throw err;
} finally {
  await client.end();
}

const r = spawnSync("node", ["scripts/seed-test-data.mjs"], {
  env: { ...process.env, TEST_DATA: "on" },
  stdio: "inherit",
});
process.exit(r.status ?? 1);
