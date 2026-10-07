// Creates (or resets the password of) the admin account from ADMIN_USERNAME / ADMIN_EMAIL / ADMIN_PASSWORD.
// Usage: npm run db:seed-admin
import bcrypt from "bcryptjs";
import pg from "pg";

const { DATABASE_URL, ADMIN_USERNAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
if (!DATABASE_URL || !ADMIN_USERNAME || !ADMIN_PASSWORD) {
  console.error("DATABASE_URL, ADMIN_USERNAME and ADMIN_PASSWORD must be set (see .env.local).");
  process.exit(1);
}
if (ADMIN_PASSWORD.length < 8) {
  console.error("ADMIN_PASSWORD must be at least 8 characters.");
  process.exit(1);
}

const local = /localhost|127\.0\.0\.1/.test(DATABASE_URL);
const client = new pg.Client({ connectionString: DATABASE_URL, ssl: local ? false : { rejectUnauthorized: false } });

await client.connect();
try {
  const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const email = (ADMIN_EMAIL || `${ADMIN_USERNAME}@admin.local`).toLowerCase();
  const existing = await client.query("SELECT id, role FROM users WHERE lower(username) = lower($1)", [ADMIN_USERNAME]);
  if (existing.rows[0] && existing.rows[0].role !== "admin") {
    console.error(`User "${ADMIN_USERNAME}" exists and is not an admin; choose another ADMIN_USERNAME.`);
    process.exit(1);
  }
  if (existing.rows[0]) {
    await client.query("UPDATE users SET password_hash = $1, status = 'active' WHERE id = $2", [hash, existing.rows[0].id]);
    console.log(`Admin "${ADMIN_USERNAME}" password updated.`);
  } else {
    await client.query(
      "INSERT INTO users (username, email, name, password_hash, role) VALUES ($1, $2, 'Admin', $3, 'admin')",
      [ADMIN_USERNAME, email, hash],
    );
    console.log(`Admin "${ADMIN_USERNAME}" created.`);
  }
} finally {
  await client.end();
}
