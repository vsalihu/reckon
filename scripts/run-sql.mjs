// One-off helper to apply supabase/schema.sql (or any .sql file) directly
// against Postgres, for when the Supabase CLI/Management API isn't linked.
// Usage: DATABASE_URL=... node scripts/run-sql.mjs path/to/file.sql
import { readFileSync } from "node:fs";
import pg from "pg";

const [, , sqlPath] = process.argv;
if (!sqlPath) {
  console.error("Usage: node scripts/run-sql.mjs <path-to-sql-file>");
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("Set DATABASE_URL env var first.");
  process.exit(1);
}

const sql = readFileSync(sqlPath, "utf8");
const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  await client.query(sql);
  console.log(`Applied ${sqlPath} successfully.`);
} catch (err) {
  console.error("Failed to apply SQL:", err.message);
  process.exit(1);
} finally {
  await client.end();
}
