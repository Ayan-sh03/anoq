import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const connection = (process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL)?.trim();
if (!connection) {
  console.error("Set DATABASE_URL or DATABASE_URL_UNPOOLED before applying the schema.");
  process.exit(1);
}

const schema = fileURLToPath(new URL("../server/migrations/schema.sql", import.meta.url));
const database = new URL(connection);
const password = database.searchParams.get("password") || decodeURIComponent(database.password);
database.password = "";
database.searchParams.delete("password");
const result = spawnSync("psql", ["-X", "--set", "ON_ERROR_STOP=1", "--dbname", database.href, "--file", schema], {
  env: { ...process.env, ...(password ? { PGPASSWORD: password } : {}) },
  stdio: "inherit",
});
if (result.error) console.error("Could not run psql. Install the PostgreSQL client and check PATH.");
process.exit(result.status ?? 1);
