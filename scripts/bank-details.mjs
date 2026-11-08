// Converts sellers' bank details between plaintext and encrypted form.
//
//   npm run db:bank-details -- status     how many stores are in each form
//   npm run db:bank-details -- encrypt    encrypt every plaintext row, then clear the plaintext (needs BANK_DETAILS_KEY)
//   npm run db:bank-details -- decrypt    the reverse, needed before rolling back migration 1731000500000
//
// Run `encrypt` once after applying that migration (and again any time a plaintext row appears, e.g. after restoring an
// old backup). It is safe to repeat: rows that are already encrypted are left alone. Each run is one transaction.
import pg from "pg";
import { bankKey, decryptJson, encryptJson } from "./lib/bank-crypto.mjs";
import { sslFor } from "./lib/pg-ssl.mjs";

const url = process.env.DATABASE_URL;
const mode = process.argv[2];
if (!url) {
  console.error("DATABASE_URL is not set (expected in .env.local).");
  process.exit(1);
}
if (!["status", "encrypt", "decrypt"].includes(mode ?? "")) {
  console.error("Usage: npm run db:bank-details -- status | encrypt | decrypt");
  process.exit(1);
}
const key = bankKey();
if (mode !== "status" && !key) {
  console.error("BANK_DETAILS_KEY is not set (32 random bytes as base64 or 64 hex characters). See scripts/lib/bank-crypto.mjs.");
  process.exit(1);
}

const db = new pg.Client({ connectionString: url, ssl: sslFor(url) });
await db.connect();
try {
  if (mode === "status") {
    const { rows } = await db.query(
      `SELECT count(*) FILTER (WHERE bank_details IS NOT NULL) AS plaintext,
              count(*) FILTER (WHERE bank_details_enc IS NOT NULL) AS encrypted,
              count(*) AS stores FROM stores`,
    );
    console.log(`Stores: ${rows[0].stores} - encrypted: ${rows[0].encrypted}, still plaintext: ${rows[0].plaintext}`);
  } else {
    await db.query("BEGIN");
    let changed = 0;
    if (mode === "encrypt") {
      const { rows } = await db.query("SELECT id, bank_details, bank_details_optional FROM stores WHERE bank_details IS NOT NULL FOR UPDATE");
      for (const r of rows) {
        await db.query(
          "UPDATE stores SET bank_details_enc = $2, bank_details_optional_enc = $3, bank_details = NULL, bank_details_optional = NULL WHERE id = $1",
          [r.id, encryptJson(r.bank_details, key), r.bank_details_optional ? encryptJson(r.bank_details_optional, key) : null],
        );
        changed += 1;
      }
    } else {
      const { rows } = await db.query("SELECT id, bank_details_enc, bank_details_optional_enc FROM stores WHERE bank_details_enc IS NOT NULL FOR UPDATE");
      for (const r of rows) {
        await db.query(
          "UPDATE stores SET bank_details = $2, bank_details_optional = $3, bank_details_enc = NULL, bank_details_optional_enc = NULL WHERE id = $1",
          [r.id, decryptJson(r.bank_details_enc, key), r.bank_details_optional_enc ? decryptJson(r.bank_details_optional_enc, key) : null],
        );
        changed += 1;
      }
    }
    await db.query("COMMIT");
    console.log(`${mode === "encrypt" ? "Encrypted" : "Decrypted"} bank details for ${changed} store(s).`);
  }
} catch (err) {
  await db.query("ROLLBACK").catch(() => {});
  throw err;
} finally {
  await db.end();
}
