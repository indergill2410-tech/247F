import {
  pgTable,
  serial,
  text,
  integer,
  real,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { categoriesTable } from "./categories";

export const jobStatusEnum = pgEnum("job_status", [
  "open",
  "matched",
  "in_progress",
  "completed",
  "cancelled",
]);

export const urgencyEnum = pgEnum("urgency", ["standard", "urgent", "emergency"]);

export const sizeBandEnum = pgEnum("size_band", ["small", "medium", "large", "premium"]);

export const jobsTable = pgTable("jobs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: jobStatusEnum("status").notNull().default("open"),
  urgency: urgencyEnum("urgency").notNull().default("standard"),
  categoryId: integer("category_id")
    .notNull()
    .references(() => categoriesTable.id),
  homeownerId: integer("homeowner_id")
    .notNull()
    .references(() => usersTable.id),
  suburb: text("suburb"),
  postcode: text("postcode"),
  address: text("address"),
  imageUrls: text("image_urls").array().notNull().default([]),
  budget: real("budget"),
  sizeBand: sizeBandEnum("size_band"),
  creditCost: integer("credit_cost"),
  scheduledFor: timestamp("scheduled_for", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertJobSchema = createInsertSchema(jobsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertJob = z.infer<typeof insertJobSchema>;
export type Job = typeof jobsTable.$inferSelect;
