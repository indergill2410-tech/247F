import { pool } from "@workspace/db";
import { hashPassword } from "./auth.js";
import { logger } from "./logger.js";

const WELCOME_GRANT_CENTS = 11100; // $111.00

export async function seedDemoAccounts(): Promise<{ created: string[]; refreshed: string[] }> {
  const demos = [
    { name: "Alex homeowner", email: "homeowner@fixit247.com", password: "password123", role: "homeowner" },
    { name: "Sam Tradie",     email: "tradie@fixit247.com",    password: "password123", role: "tradie" },
    { name: "Admin",          email: "admin@fixit247.com",     password: "admin123",    role: "admin" },
  ] as const;

  const created: string[] = [];
  const refreshed: string[] = [];

  for (const demo of demos) {
    // Always re-hash with current scrypt format — fixes accounts seeded with bcrypt
    const passwordHash = hashPassword(demo.password);

    const existing = await pool.query<{ id: number }>(
      "SELECT id FROM users WHERE email = $1", [demo.email]
    );

    let userId: number;
    if (existing.rows.length > 0) {
      userId = existing.rows[0]!.id;
      await pool.query(
        "UPDATE users SET password_hash = $1, is_active = true WHERE id = $2",
        [passwordHash, userId]
      );
      refreshed.push(demo.email);
    } else {
      const result = await pool.query<{ id: number }>(
        `INSERT INTO users (name, email, password_hash, role, is_active)
         VALUES ($1, $2, $3, $4, true) RETURNING id`,
        [demo.name, demo.email, passwordHash, demo.role]
      );
      userId = result.rows[0]!.id;
      created.push(demo.email);
    }

    if (demo.role === "tradie") {
      await pool.query(
        `INSERT INTO wallet_balances (user_id, balance_cents) VALUES ($1, $2) ON CONFLICT (user_id) DO NOTHING`,
        [userId, WELCOME_GRANT_CENTS]
      );
    }
  }

  logger.info({ created, refreshed }, "Demo accounts seeded");
  return { created, refreshed };
}
