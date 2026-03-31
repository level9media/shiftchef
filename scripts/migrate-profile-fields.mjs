import mysql from "mysql2/promise";
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env") });

const conn = await mysql.createConnection(process.env.DATABASE_URL);

try {
  await conn.execute("ALTER TABLE `users` ADD COLUMN `yearsExperience` int DEFAULT 0");
  console.log("✓ Added yearsExperience");
} catch (e) {
  if (e.code === "ER_DUP_FIELDNAME") console.log("⚠ yearsExperience already exists");
  else throw e;
}

try {
  await conn.execute("ALTER TABLE `users` ADD COLUMN `specialty` varchar(128)");
  console.log("✓ Added specialty");
} catch (e) {
  if (e.code === "ER_DUP_FIELDNAME") console.log("⚠ specialty already exists");
  else throw e;
}

console.log("Migration complete");
await conn.end();
