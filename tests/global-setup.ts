import { randomBytes } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import pg from "pg";

/**
 * Integration tests run against a real Postgres, but never against the real tables: every run creates a
 * throwaway schema, applies db/schema.sql into it, points DATABASE_URL at it (via search_path) and drops it after.
 * Uses TEST_DATABASE_URL if set, otherwise DATABASE_URL from .env.local.
 */
let adminUrl = "";
let schema = "";

const connect = () => {
  const local = /localhost|127\.0\.0\.1/.test(adminUrl);
  return new pg.Client({ connectionString: adminUrl, ssl: local ? false : { rejectUnauthorized: false } });
};

export async function setup() {
  if (existsSync(".env.local")) process.loadEnvFile(".env.local");
  adminUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || "";
  if (!adminUrl) throw new Error("Set TEST_DATABASE_URL (or DATABASE_URL in .env.local) to run the database tests.");

  schema = `velora_test_${randomBytes(6).toString("hex")}`;
  const client = connect();
  await client.connect();
  try {
    await client.query(`CREATE SCHEMA ${schema}`);
  } finally {
    await client.end();
  }
  // Apply db/schema.sql inside the throwaway schema (unqualified names land in the first search_path entry).
  const setupClient = connect();
  await setupClient.connect();
  try {
    await setupClient.query(`SET search_path TO ${schema}, public`);
    await setupClient.query(readFileSync("db/schema.sql", "utf8"));
  } finally {
    await setupClient.end();
  }

  const url = new URL(adminUrl);
  url.searchParams.set("options", `-c search_path=${schema},public`);
  process.env.DATABASE_URL = url.toString();
  process.env.JWT_SECRET = "test-secret-test-secret-test-secret-123456";
  process.env.BANK_DETAILS_KEY = randomBytes(32).toString("base64");
}

export async function teardown() {
  if (!schema) return;
  const client = connect();
  await client.connect();
  try {
    await client.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
  } finally {
    await client.end();
  }
}
