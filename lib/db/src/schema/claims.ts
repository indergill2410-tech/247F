import {
  pgTable,
  serial,
  integer,
  text,
  real,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { jobsTable } from "./jobs";

export const claimStatusEnum = pgEnum("claim_status", [
  "pending",
  "accepted",
  "rejected",
  "withdrawn",
  "completed",
]);

export const claimsTable = pgTable("claims", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id")
    .notNull()
    .references(() => jobsTable.id),
  tradieId: integer("tradie_id")
    .notNull()
    .references(() => usersTable.id),
  status: claimStatusEnum("status").notNull().default("pending"),
  message: text("message"),
  proposedPrice: real("proposed_price"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertClaimSchema = createInsertSchema(claimsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertClaim = z.infer<typeof insertClaimSchema>;
export type Claim = typeof claimsTable.$inferSelect;
