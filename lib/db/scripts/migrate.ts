import { migrate } from "drizzle-orm/node-postgres/migrator";
import { fileURLToPath } from "url";
import path from "path";
import { db, pool } from "../src/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  console.log("Running database migrations...");
  await migrate(db, { migrationsFolder: path.join(__dirname, "../migrations") });
  console.log("Migrations complete.");
  await pool.end();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
