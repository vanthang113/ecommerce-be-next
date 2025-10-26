import { pool } from "../config/db";
import { hashPassword } from "../utils/password";

async function seed() {
  const email = process.env.SEED_ADMIN_EMAIL || "admin@example.com";
  const pw = process.env.SEED_ADMIN_PASS || "Admin@123";
  const hashed = await hashPassword(pw);
  await pool.query(
    "INSERT INTO users (name,email,password,role,created_at) VALUES (?,?,?,?,NOW()) ON DUPLICATE KEY UPDATE password=VALUES(password), role=VALUES(role)",
    ["Admin", email, hashed, "admin"]
  );
  console.log("Admin upserted:", email);
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
