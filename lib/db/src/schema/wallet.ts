import {
  pgTable,
  serial,
  integer,
  text,
  timestamp,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { jobsTable } from "./jobs";

export const walletTxTypeEnum = pgEnum("wallet_tx_type", [
  "welcome_grant",
  "subscription_grant",
  "lead_deduct",
  "refund",
  "adjustment",
]);

// Dollar wallet — balance stored in cents (e.g. $111.00 = 11100)
export const walletBalancesTable = pgTable("wallet_balances", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id)
    .unique(),
  balanceCents: integer("balance_cents").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const walletTransactionsTable = pgTable("wallet_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id),
  type: walletTxTypeEnum("type").notNull(),
  // Positive = credit to wallet, negative = debit. Stored in cents.
  amountCents: integer("amount_cents").notNull(),
  description: text("description"),
  stripeSessionId: text("stripe_session_id"),
  jobId: integer("job_id").references(() => jobsTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("wallet_transactions_user_id_idx").on(table.userId),
}));

export type WalletBalance = typeof walletBalancesTable.$inferSelect;
export type WalletTransaction = typeof walletTransactionsTable.$inferSelect;
