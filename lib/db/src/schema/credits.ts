import {
  pgTable,
  serial,
  integer,
  text,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const creditTxTypeEnum = pgEnum("credit_tx_type", [
  "signup_grant",
  "monthly_renewal",
  "purchase",
  "claim_deduct",
  "refund",
]);

export const creditBalancesTable = pgTable("credit_balances", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id)
    .unique(),
  balance: integer("balance").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const creditTransactionsTable = pgTable("credit_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id),
  type: creditTxTypeEnum("type").notNull(),
  amount: integer("amount").notNull(),
  description: text("description"),
  stripeSessionId: text("stripe_session_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type CreditBalance = typeof creditBalancesTable.$inferSelect;
export type CreditTransaction = typeof creditTransactionsTable.$inferSelect;
